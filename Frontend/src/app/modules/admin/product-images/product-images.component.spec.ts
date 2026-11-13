import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { Product, ProductImage, ProductImagePayload, ProductImageQuery } from '../../../core/models/catalog.models';
import { ProductImagesComponent } from './product-images.component';

describe('ProductImagesComponent viewer', () => {
  const first: ProductImage = { id: 1, productId: 10, productName: 'Bat', productIsPublished: false, url: '/first.png', sortOrder: 0 };
  const second: ProductImage = { id: 2, productId: 10, productName: 'Bat', productIsPublished: false, url: '/second.png', sortOrder: 1 };
  const product: Product = {
    id: 10, name: 'Bat', slug: 'bat', sku: 'bat', categoryId: 1, brandId: 1,
    mrp: 0, salePrice: 0, costPrice: 0, discountPct: 0, shortDesc: null, description: null,
    stock: 0, avgRating: 0, reviewCount: 0, salesCount: 0, sortOrder: 0, metaTitle: null,
    metaDesc: null, isActive: true, hasImage: true, isPublished: false,
    createdAt: '', updatedAt: '', createdBy: null,
  };
  const page = (items: ProductImage[], pageNumber = 1, totalCount = items.length) =>
    ({ items, pageNumber, totalCount, pageSize: 100 });
  const api = {
    getProductImages: vi.fn((query: ProductImageQuery) => of(page(query.productId === null ? [first, second] : []))),
    reorderProductImages: vi.fn(() => of(undefined)),
    activateProduct: vi.fn(() => of(undefined)),
    createProductImage: vi.fn((_image: ProductImagePayload) => of(first)),
    uploadProductImage: vi.fn((_file: File) => of({ url: '/uploaded.png' })),
    getProducts: vi.fn(() => of({ items: [] as Product[], totalCount: 0, pageNumber: 1, pageSize: 100 })),
    deleteProductImage: vi.fn((_id: number) => of(undefined)),
    resolveAssetUrl: (url: string) => url,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.getProductImages.mockImplementation((query) => of(page(query.productId === null ? [first, second] : [])));
    api.createProductImage.mockImplementation(() => of(first));
    api.uploadProductImage.mockImplementation(() => of({ url: '/uploaded.png' }));
    api.getProducts.mockImplementation(() => of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 100 }));
    api.deleteProductImage.mockImplementation(() => of(undefined));
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn((file: File) => `blob:${file.name}`), revokeObjectURL: vi.fn() }));
    TestBed.configureTestingModule({ providers: [{ provide: CatalogApiService, useValue: api }] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('selects all images in collapsed groups on the current page', () => {
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    element.querySelector<HTMLInputElement>('app-bulk-delete input')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('app-bulk-delete .bulk-toolbar button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('app-bulk-delete [role=dialog]')?.textContent).toContain('Selected IDs: 1, 2');
    element.querySelector<HTMLButtonElement>('app-bulk-delete .bulk-confirm')!.click();
    expect(api.deleteProductImage.mock.calls.map(([id]) => id)).toEqual([1, 2]);
  });

  it('displays saved image counts in the product dropdown and refreshes them after changes', async () => {
    const emptyProduct = { ...product, id: 20, name: 'Ball', isActive: false };
    api.getProducts.mockReturnValue(of({ items: [product, emptyProduct], totalCount: 2, pageNumber: 1, pageSize: 100 }));
    let batCount = 3;
    api.getProductImages.mockImplementation(query => of(page([], query.pageNumber,
      query.productId === 10 && query.isActive ? batCount : 0)));
    api.createProductImage.mockImplementation(() => { batCount++; return of(first); });
    api.deleteProductImage.mockImplementation(() => { batCount--; return of(undefined); });
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const options = () => [...fixture.nativeElement.querySelectorAll('select[name=productId] option')]
      .map(option => (option as HTMLOptionElement).textContent?.trim());
    expect(options()).toEqual(['Select product', 'Bat (3)', 'Ball (0)']);
    expect(api.getProductImages).toHaveBeenCalledWith(expect.objectContaining({ productId: 20, isActive: false, pageSize: 1 }));
    const component = fixture.componentInstance;
    component.draft.productId = 10;
    component.draft.url = '/new.png';
    component.save();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(options()).toContain('Bat (4)');
    component.delete(first);
    component.confirmDelete();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(options()).toContain('Bat (3)');
  });

  it('shows unavailable counts and allows retry after a lookup fails', async () => {
    api.getProducts.mockReturnValue(of({ items: [product], totalCount: 1, pageNumber: 1, pageSize: 100 }));
    api.getProductImages.mockImplementation(query => query.productId === 10
      ? throwError(() => new Error('Count unavailable')) : of(page([])));
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('select[name=productId]')?.textContent).toContain('Bat (?)');
    expect(element.querySelector('.editor-card [role=alert]')?.textContent).toContain('Count unavailable');
    api.getProductImages.mockImplementation(() => of(page([first])));
    element.querySelector<HTMLButtonElement>('.editor-card [role=alert] button')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector('select[name=productId]')?.textContent).toContain('Bat (1)');
    expect(element.querySelector('.editor-card [role=alert]')).toBeNull();
  });

  it('previews multiple files, removes a selection, and saves the remainder in order', async () => {
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.draft.productId = 10;
    component.draft.sortOrder = 1;
    const files = ['first.png', 'second.png', 'third.png'].map(name => new File(['x'], name, { type: 'image/png' }));
    component.onFileSelected({ target: { files, value: 'files' } } as unknown as Event);
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector<HTMLInputElement>('input[type=file]')?.multiple).toBe(true);
    expect(element.querySelectorAll('.selected-preview img')).toHaveLength(3);
    expect(api.uploadProductImage).not.toHaveBeenCalled();
    element.querySelector<HTMLButtonElement>('[aria-label="Remove second.png"]')!.click();
    expect(component.selectedImages.map(image => image.file.name)).toEqual(['first.png', 'third.png']);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:second.png');
    component.save();
    expect(api.uploadProductImage.mock.calls.map(([file]) => file.name)).toEqual(['first.png', 'third.png']);
    expect(api.createProductImage.mock.calls.map(([payload]) => payload.sortOrder)).toEqual([1, 2]);
    expect(component.selectedImages).toHaveLength(0);
    expect(component.successMessage).toContain('2 image(s) added');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:first.png');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:third.png');
  });

  it('keeps unsaved previews on failure and retries an uploaded file without uploading it twice', () => {
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.draft.productId = 10;
    component.draft.sortOrder = 3;
    const files = ['first.png', 'second.png', 'third.png'].map(name => new File(['x'], name, { type: 'image/png' }));
    component.onFileSelected({ target: { files, value: '' } } as unknown as Event);
    api.createProductImage.mockReturnValueOnce(of(first)).mockReturnValueOnce(throwError(() => new Error('Save failed')));
    component.save();
    expect(component.errorMessage).toContain('1 of 3 images saved');
    expect(component.errorMessage).toContain('Save failed');
    expect(component.selectedImages.map(image => image.file.name)).toEqual(['second.png', 'third.png']);
    expect(component.draft.sortOrder).toBe(4);
    component.save();
    expect(api.uploadProductImage.mock.calls.map(([file]) => file.name)).toEqual(['first.png', 'second.png', 'third.png']);
    expect(api.createProductImage.mock.calls.map(([payload]) => payload.sortOrder)).toEqual([3, 4, 4, 5]);
    expect(component.selectedImages).toHaveLength(0);
  });

  it('prevents changes during save and cleans up previews when reset or destroyed', () => {
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.draft.productId = 10;
    const file = new File(['x'], 'pending.png', { type: 'image/png' });
    component.onFileSelected({ target: { files: [file], value: '' } } as unknown as Event);
    const pending = new Subject<{ url: string }>();
    api.uploadProductImage.mockReturnValueOnce(pending);
    component.save();
    component.reset();
    expect(component.selectedImages).toHaveLength(1);
    pending.error(new Error('Upload failed'));
    expect(component.errorMessage).toContain('Upload failed');
    component.reset();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:pending.png');
    component.onFileSelected({ target: { files: [file], value: '' } } as unknown as Event);
    fixture.destroy();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid batches and keeps editing limited to one replacement image', async () => {
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const valid = new File(['x'], 'valid.png', { type: 'image/png' });
    const invalid = new File(['x'], 'invalid.txt', { type: 'text/plain' });
    component.onFileSelected({ target: { files: [valid, invalid], value: '' } } as unknown as Event);
    expect(component.errorMessage).toContain('choose an image');
    expect(component.selectedImages).toHaveLength(0);
    fixture.nativeElement.querySelector('.editor-card').scrollIntoView = vi.fn();
    component.edit(first);
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input[type=file]') as HTMLInputElement).multiple).toBe(false);
    component.onFileSelected({ target: { files: [valid], value: '' } } as unknown as Event);
    expect(component.selectedFile).toBe(valid);
    expect(component.selectedImages).toHaveLength(0);
    fixture.destroy();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:valid.png');
  });

  it('assigns the next order when a product is selected and saves it', async () => {
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.products = [product];
    fixture.changeDetectorRef.markForCheck();
    await fixture.whenStable();
    fixture.detectChanges();
    api.getProductImages.mockImplementation(query => of(page(query.productId === 10 && query.isActive ? [first] : [])));
    const select = fixture.nativeElement.querySelector('select[name=productId]') as HTMLSelectElement;
    select.value = select.options[1].value;
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(api.getProductImages).toHaveBeenCalledWith(expect.objectContaining({
      productId: 10, pageSize: 2, sortBy: 'sortOrder', sortDirection: 'desc', isActive: false,
    }));
    expect((fixture.nativeElement.querySelector('input[name=sortOrder]') as HTMLInputElement).value).toBe('1');
    component.draft.url = '/new.png';
    component.save();
    expect(api.createProductImage).toHaveBeenCalledWith({ productId: 10, url: '/new.png', sortOrder: 1 });
  });

  it('uses the highest order, handles empty products and excludes the image being edited', () => {
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    api.getProductImages.mockImplementation(query => of(page(
      query.productId === 10 && !query.isActive ? [{ ...second, sortOrder: 8 }, first] : [],
    )));
    component.updateSortOrder(10);
    expect(component.draft.sortOrder).toBe(9);
    component.editingId = second.id;
    component.updateSortOrder(10);
    expect(component.draft.sortOrder).toBe(1);
    component.updateSortOrder(20);
    expect(component.draft.sortOrder).toBe(0);
  });

  it('cancels stale lookups and blocks saving after a lookup failure until retry', () => {
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const pending = new Subject<ReturnType<typeof page>>();
    api.getProductImages.mockImplementation(query => query.productId === 10
      ? pending : of(page([{ ...second, productId: 20, sortOrder: 4 }])));
    component.draft.productId = 10;
    component.updateSortOrder(10);
    expect(component.sortOrderLoading).toBe(true);
    component.draft.productId = 20;
    component.updateSortOrder(20);
    expect(pending.observed).toBe(false);
    expect(component.draft.sortOrder).toBe(5);
    api.getProductImages.mockImplementation(() => throwError(() => new Error('Lookup failed')));
    component.updateSortOrder(20);
    expect(component.sortOrderError).toContain('Lookup failed');
    component.draft.url = '/new.png';
    component.save();
    expect(api.createProductImage).not.toHaveBeenCalled();
    api.getProductImages.mockImplementation(() => of(page([])));
    component.updateSortOrder(20);
    expect(component.sortOrderError).toBe('');
    expect(component.draft.sortOrder).toBe(0);
  });

  it('shows an activate button beside an unpublished product and updates after activation', () => {
    api.getProductImages.mockReturnValue(of(page([first, second])));
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector<HTMLButtonElement>('[aria-label="Activate Bat"]')!;
    expect(button.disabled).toBe(false);
    api.getProductImages.mockReturnValue(of(page([
      { ...first, productIsPublished: true }, { ...second, productIsPublished: true },
    ])));
    button.click();
    fixture.detectChanges();
    expect(api.activateProduct).toHaveBeenCalledWith(10);
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Bat is active');
    expect(element.querySelector('[aria-label="Activate Bat"]')).toBeNull();
    expect(element.querySelector('.product-group .status-pill')?.textContent).toContain('Active');
  });

  it('shows an activation error and leaves the button available for retry', () => {
    api.getProductImages.mockReturnValue(of(page([first])));
    api.activateProduct.mockReturnValueOnce(throwError(() => new Error('Image was removed')));
    const fixture = TestBed.createComponent(ProductImagesComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('[aria-label="Activate Bat"]')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Image was removed');
    expect(element.querySelector<HTMLButtonElement>('[aria-label="Activate Bat"]')?.disabled).toBe(false);
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
