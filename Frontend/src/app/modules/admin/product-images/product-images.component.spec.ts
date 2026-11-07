import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { ProductImage, ProductImageQuery } from '../../../core/models/catalog.models';
import { ProductImagesComponent } from './product-images.component';

describe('ProductImagesComponent viewer', () => {
  const first: ProductImage = { id: 1, productId: 10, productName: 'Bat', url: '/first.png', sortOrder: 0 };
  const second: ProductImage = { id: 2, productId: 10, productName: 'Bat', url: '/second.png', sortOrder: 1 };
  const page = (items: ProductImage[], pageNumber = 1, totalCount = items.length) =>
    ({ items, pageNumber, totalCount, pageSize: 100 });
  const api = {
    getProductImages: vi.fn((query: ProductImageQuery) => of(page(query.productId === null ? [first, second] : []))),
    reorderProductImages: vi.fn(() => of(undefined)),
    getProducts: () => of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 100 }),
    resolveAssetUrl: (url: string) => url,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({ providers: [{ provide: CatalogApiService, useValue: api }] });
  });

  it('opens the main image from the product row, loads all pages and navigates images', () => {
    api.getProductImages.mockImplementation((query) => {
      if (query.productId === null) return of(page([first, second]));
      return of(query.pageNumber === 1 ? page([first], 1, 101) : page([second], 2, 101));
    });
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const dialog = element.querySelector<HTMLDialogElement>('dialog')!;
    dialog.showModal = vi.fn();
    element.querySelector<HTMLButtonElement>('[aria-label="View images for Bat"]')!.click();
    fixture.detectChanges();
    expect(dialog.showModal).toHaveBeenCalledOnce();
    expect(dialog.querySelector('.viewer-product span')?.textContent).toBe('Product:');
    expect(dialog.querySelector('.viewer-product strong')?.textContent).toBe('Bat');
    expect(fixture.componentInstance.viewerCurrent).toEqual(first);
    expect(api.getProductImages).toHaveBeenCalledWith(expect.objectContaining({ productId: 10, pageNumber: 2, isActive: true }));
    dialog.querySelector<HTMLButtonElement>('[aria-label="Next image"]')!.click();
    expect(fixture.componentInstance.viewerCurrent).toEqual(second);
  });

  it('handles inactive products and shows request and image failures inside the viewer', () => {
    api.getProductImages.mockImplementation((query) => query.productId !== null
      ? throwError(() => new Error('Gallery unavailable'))
      : of(page([first])));
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    fixture.componentInstance.activeTab = 'inactive';
    fixture.componentInstance.previewInViewer(first);
    fixture.detectChanges();
    expect(api.getProductImages).toHaveBeenCalledWith(expect.objectContaining({ productId: 10, isActive: false }));
    expect(fixture.nativeElement.querySelector('dialog [role="alert"]').textContent).toContain('Gallery unavailable');
    api.getProductImages.mockReturnValue(of(page([first])));
    fixture.componentInstance.previewInViewer(first);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.viewer-main img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog [role="alert"]').textContent).toContain('could not be loaded');
  });

  it('cancels the previous request when the viewer is closed or reopened', () => {
    const pending = new Subject<ReturnType<typeof page>>();
    api.getProductImages.mockImplementation((query) => query.productId !== null ? pending : of(page([first])));
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.previewInViewer(first);
    expect(pending.observed).toBe(true);
    component.closeViewer();
    expect(pending.observed).toBe(false);
    expect(component.viewerImages).toEqual([]);
    component.previewInViewer(first);
    component.previewInViewer(second);
    expect(pending.observers).toHaveLength(1);
    fixture.destroy();
    expect(pending.observed).toBe(false);
  });

  it('groups images, saves a new main image and prevents cross-product drops', () => {
    const other = { ...second, id: 3, productId: 20, productName: 'Ball' };
    api.getProductImages.mockReturnValue(of(page([second, other, first])));
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
    element.querySelector<HTMLButtonElement>('[aria-label="Expand Bat images"]')!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr:not(.product-group) [title^="View"]')).toHaveLength(0);
    const bat = component.imageGroups.find(group => group.productId === 10)!;
    expect(bat.images.map(image => image.id)).toEqual([1, 2]);
    element.querySelector<HTMLButtonElement>('[aria-label="Move image 2 up"]')!.click();
    expect(api.reorderProductImages).toHaveBeenCalledWith(10, [{ id: 2, sortOrder: 1 }, { id: 1, sortOrder: 0 }]);
    expect(component.imageGroups.find(group => group.productId === 10)!.images.map(image => image.id)).toEqual([2, 1]);
    fixture.detectChanges();
    const edit = vi.spyOn(component, 'edit').mockImplementation(() => {});
    element.querySelector<HTMLButtonElement>('[aria-label="Edit main image for Bat"]')!.click();
    expect(edit).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    element.querySelector<HTMLButtonElement>('[aria-label="Delete main image for Bat"]')!.click();
    expect(component.imageToDelete?.id).toBe(2);
    fixture.detectChanges();
    expect(element.querySelector('[aria-labelledby="delete-title"]')?.textContent).toContain('image #2');
    component.cancelDelete();
    expect(element.querySelector('tbody')?.textContent).toContain('Main image');
    component.draggingId = 3;
    component.drop({ preventDefault: vi.fn() } as unknown as DragEvent, component.imageGroups.find(group => group.productId === 10)!, first);
    expect(api.reorderProductImages).toHaveBeenCalledTimes(1);
  });

  it('preserves order on conflict and groups pages by product', () => {
    api.reorderProductImages.mockReturnValueOnce(throwError(() => new Error('conflict')));
    const other = { ...first, id: 3, productId: 20, productName: 'Ball' };
    api.getProductImages.mockReturnValue(of(page([first, second, other])));
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.pageSize = 1;
    expect(component.pageCount).toBe(2);
    expect(component.visibleGroups[0].productName).toBe('Ball');
    component.changePage(2);
    const group = component.visibleGroups[0];
    expect(group.images.map(image => image.id)).toEqual([1, 2]);
    component.moveImage(group, 1, -1);
    expect(component.errorMessage).toContain('conflict');
    expect(component.visibleGroups[0].images.map(image => image.id)).toEqual([1, 2]);
    component.searchTerm = 'Bat';
    expect(component.canReorder(group)).toBe(false);
  });

  it('loads image groups spanning API pages and supports drag reordering', () => {
    api.getProductImages.mockImplementation(query => {
      if (query.pageSize === 1) return of(page([], 1, 101));
      if (query.pageNumber === 1) return of(page([first], 1, 101));
      return of(page([second], 2, 101));
    });
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const group = component.imageGroups[0];
    expect(group.images.map(image => image.id)).toEqual([1, 2]);
    const dataTransfer = { effectAllowed: '', dropEffect: '', setData: vi.fn() };
    const event = { preventDefault: vi.fn(), dataTransfer } as unknown as DragEvent;
    component.dragStart(event, group, second);
    component.dragOver(event, group, first);
    expect(event.preventDefault).toHaveBeenCalled();
    component.drop(event, group, first);
    expect(api.reorderProductImages).toHaveBeenCalledWith(10, [{ id: 2, sortOrder: 1 }, { id: 1, sortOrder: 0 }]);
  });
});
