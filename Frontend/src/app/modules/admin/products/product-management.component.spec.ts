import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { Category, Product } from '../../../core/models/catalog.models';
import { ProductManagementComponent } from './product-management.component';

describe('ProductManagementComponent details', () => {
  const product: Product = {
    id: 1, name: 'Bat', slug: 'bat', sku: 'CB-1', categoryId: 1, brandId: 2,
    mrp: 100, salePrice: 80, costPrice: 40, discountPct: 20,
    shortDesc: 'Short', description: '<p>Full details</p>', stock: 5,
    avgRating: 4, reviewCount: 2, salesCount: 3, sortOrder: 1,
    metaTitle: 'Title', metaDesc: 'Meta', isActive: true,
    createdAt: '2026-01-02T03:04:05Z', updatedAt: '2026-02-03T04:05:06Z',
    createdBy: 'admin',
  };
  const page = { items: [product], totalCount: 1, pageNumber: 1, pageSize: 10 };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductManagementComponent],
      providers: [{
        provide: CatalogApiService,
        useValue: {
          getProducts: () => of(page),
          getCategories: () => of([]),
          getBrands: () => of([]),
          getProductImages: () => of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 100 }),
          updateProduct: () => of(product),
          deleteProduct: () => of(undefined),
          deleteProductPermanently: () => of(undefined),
          resolveAssetUrl: (url: string) => url,
        },
      }],
    }).compileComponents();
  });

  it('orders category options by hierarchy and saves the selected child ID', async () => {
    const category = (id: number, name: string, parentId: number | null, sortOrder: number): Category =>
      ({ id, name, parentId, sortOrder, slug: `category-${id}`, isActive: true });
    const parent = category(1, 'Bat', null, 1);
    const child = category(2, 'English Willow', 1, 2);
    const grandchild = category(3, 'Premium', 2, 0);
    const sibling = category(4, 'Kashmir', 1, 1);
    const otherParent = category(5, 'Ball', null, 2);
    const sameName = category(6, 'Premium', 5, 0);
    const orphan = category(7, 'Other', 99, 3);
    const api = TestBed.inject(CatalogApiService);
    vi.spyOn(api, 'getCategories').mockReturnValue(of([
      grandchild, { ...parent, children: [child] }, otherParent, sibling, sameName, orphan,
    ]));
    vi.spyOn(api, 'getProducts').mockReturnValue(of({ ...page, items: [{ ...product, categoryId: 3 }] }));
    const update = vi.spyOn(api, 'updateProduct').mockReturnValue(of(product));
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select[name="categoryId"]') as HTMLSelectElement;
    expect(Array.from(select.options, (option) => option.textContent)).toEqual([
      'Select category', 'Bat', '\u00a0\u00a0\u00a0\u00a0Kashmir', '\u00a0\u00a0\u00a0\u00a0English Willow',
      '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0Premium', 'Ball', '\u00a0\u00a0\u00a0\u00a0Premium', 'Other',
    ]);
    expect(select.options[1].classList.contains('parent-category')).toBe(true);
    expect(select.options[2].classList.contains('parent-category')).toBe(false);
    expect(select.options[3].classList.contains('parent-category')).toBe(true);
    expect(select.options[4].classList.contains('parent-category')).toBe(false);
    expect(select.options[4].getAttribute('aria-label')).toBe('Bat / English Willow / Premium');
    expect(select.options[6].getAttribute('aria-label')).toBe('Ball / Premium');

    const editor = document.querySelector<HTMLElement>('.editor-card')!;
    editor.scrollIntoView = vi.fn();
    fixture.nativeElement.querySelector('[aria-label="Edit Bat"]').click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(Array.from(select.options).find((option) => option.value === select.value)?.getAttribute('aria-label'))
      .toBe('Bat / English Willow / Premium');
    select.selectedIndex = 6;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.draft.categoryId).toBe(6);
    fixture.componentInstance.saveProduct();
    expect(update).toHaveBeenCalledWith(product.id, expect.objectContaining({ categoryId: 6 }));
  });

  it('keeps cyclic categories selectable without repeating them', () => {
    const api = TestBed.inject(CatalogApiService);
    vi.spyOn(api, 'getCategories').mockReturnValue(of([
      { id: 1, name: 'First', parentId: 2, sortOrder: 1, slug: 'first', isActive: true },
      { id: 2, name: 'Second', parentId: 1, sortOrder: 2, slug: 'second', isActive: true },
    ]));
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('select[name="categoryId"] option');
    expect(options).toHaveLength(3);
    expect(options[2].textContent).toBe('\u00a0\u00a0\u00a0\u00a0Second');
    expect(options[2].getAttribute('aria-label')).toBe('First / Second');
  });

  it('edits descriptions and SEO in a popup and saves them with the product', async () => {
    const api = TestBed.inject(CatalogApiService);
    const update = vi.spyOn(api, 'updateProduct').mockReturnValue(of(product));
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    document.querySelector<HTMLElement>('.editor-card')!.scrollIntoView = vi.fn();
    element.querySelector<HTMLButtonElement>('[aria-label="Edit Bat"]')!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const dialog = element.querySelector<HTMLDialogElement>('dialog')!;
    dialog.showModal = vi.fn();
    dialog.close = vi.fn();
    element.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!.click();
    expect(dialog.showModal).toHaveBeenCalledOnce();
    const short = dialog.querySelector<HTMLInputElement>('[name="shortDesc"]')!;
    const title = dialog.querySelector<HTMLInputElement>('[name="metaTitle"]')!;
    const meta = dialog.querySelector<HTMLInputElement>('[name="metaDesc"]')!;
    const description = dialog.querySelector<HTMLElement>('[contenteditable="true"]')!;
    expect(short.value).toBe('Short');
    expect(description.innerHTML).toBe('<p>Full details</p>');
    expect(title.value).toBe('Title');
    expect(meta.value).toBe('Meta');
    short.value = 'Updated summary';
    short.dispatchEvent(new Event('input'));
    title.value = 'Updated title';
    title.dispatchEvent(new Event('input'));
    meta.value = 'Updated meta';
    meta.dispatchEvent(new Event('input'));
    description.innerHTML = '<p>Updated details</p>';
    description.dispatchEvent(new Event('input'));
    Array.from(dialog.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Done')!.click();
    expect(dialog.close).toHaveBeenCalledOnce();
    fixture.componentInstance.saveProduct();
    expect(update).toHaveBeenCalledWith(product.id, expect.objectContaining({
      shortDesc: 'Updated summary', description: '<p>Updated details</p>',
      metaTitle: 'Updated title', metaDesc: 'Updated meta',
    }));
  });

  it('shows inactive delete instead of edit, and cancellation does not delete', () => {
    const api = TestBed.inject(CatalogApiService);
    const remove = vi.spyOn(api, 'deleteProductPermanently');
    vi.spyOn(api, 'getProducts').mockReturnValue(of({ ...page, items: [{ ...product, isActive: false }] }));
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    fixture.componentInstance.selectTab('inactive');
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
    expect(row.querySelector('[title="Edit"]')).toBeNull();
    expect(row.querySelector('[aria-label="Restore Bat"] svg')).not.toBeNull();
    row.querySelector<HTMLButtonElement>('[aria-label="Permanently delete Bat"]')!.click();
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('cannot be undone');
    expect(dialog.textContent).toContain('order history');
    expect(dialog.textContent).toContain('cart and wishlist');
    Array.from(dialog.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Cancel')!.click();
    expect(remove).not.toHaveBeenCalled();
  });

  it('keeps the active product soft-delete action', () => {
    const api = TestBed.inject(CatalogApiService);
    const softDelete = vi.spyOn(api, 'deleteProduct');
    const permanentDelete = vi.spyOn(api, 'deleteProductPermanently');
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('tbody tr') as HTMLElement;
    expect(row.querySelector('[aria-label="Edit Bat"] svg')).not.toBeNull();
    row.querySelector<HTMLButtonElement>('[aria-label="Move Bat to Inactive"]')!.click();
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('restore it later');
    Array.from(dialog.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Delete')!.click();
    expect(softDelete).toHaveBeenCalledWith(product.id);
    expect(permanentDelete).not.toHaveBeenCalled();
  });

  it('permanently deletes only once and returns to a valid page', () => {
    const api = TestBed.inject(CatalogApiService);
    const inactive = { ...product, isActive: false };
    const completed = new Subject<void>();
    const remove = vi.spyOn(api, 'deleteProductPermanently').mockReturnValue(completed);
    const get = vi.spyOn(api, 'getProducts').mockImplementation((_search, currentPage, size) =>
      of({ items: currentPage === 1 ? [inactive] : [], totalCount: 1, pageNumber: currentPage ?? 1, pageSize: size ?? 10 }));
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.activeTab = 'inactive';
    component.pageSize = 1;
    component.pageNumber = 2;
    component.delete(inactive);
    component.confirmDelete();
    component.confirmDelete();
    expect(remove).toHaveBeenCalledTimes(1);
    completed.next();
    completed.complete();
    expect(component.pageNumber).toBe(1);
    expect(component.successMessage).toContain('permanently deleted');
    expect(get).toHaveBeenCalledWith('', 1, 1, 'id_desc', false);
  });

  it('surfaces a permanent deletion failure and keeps the product', () => {
    const api = TestBed.inject(CatalogApiService);
    vi.spyOn(api, 'deleteProductPermanently').mockReturnValue(throwError(() => new Error('Related records exist')));
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.delete({ ...product, isActive: false });
    component.confirmDelete();
    expect(component.errorMessage).toBe('Related records exist');
    expect(component.products).toEqual([product]);
    expect(component.deletingProduct).toBe(false);
  });

  it('defaults to product number descending and lets the user change sorting', () => {
    const api = TestBed.inject(CatalogApiService);
    const getProducts = vi.spyOn(api, 'getProducts');
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    expect(getProducts).toHaveBeenCalledWith('', 1, 10, 'id_desc', true);
    const element = fixture.nativeElement as HTMLElement;
    const header = Array.from(element.querySelectorAll('th'))
      .find((item) => item.textContent?.includes('PRODUCT NO.'))!;
    expect(header.getAttribute('aria-sort')).toBe('descending');
    expect(header.textContent).toContain('▼');
    header.querySelector('button')!.click();
    expect(getProducts).toHaveBeenLastCalledWith('', 1, 10, 'id_asc', true);
    fixture.componentInstance.selectTab('inactive');
    expect(getProducts).toHaveBeenLastCalledWith('', 1, 10, 'id_asc', false);
    fixture.componentInstance.sort('name');
    expect(getProducts).toHaveBeenLastCalledWith('', 1, 10, 'name_asc', false);
  });

  it('reports an export failure and re-enables the download buttons', async () => {
    const api = TestBed.inject(CatalogApiService);
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    vi.spyOn(api, 'getProducts').mockReturnValue(throwError(() => new Error('Export API unavailable')));
    await fixture.componentInstance.exportProducts('excel');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Export failed: Export API unavailable');
    expect(element.querySelector<HTMLButtonElement>('.heading-actions button')?.disabled).toBe(false);
  });

  it('shows audit fields and details even when there are no images', () => {
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('admin');
    const button = element.querySelector<HTMLButtonElement>('[aria-label="View details for Bat"]');
    expect(button).not.toBeNull();
    button!.click();
    fixture.detectChanges();
    const dialog = element.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('No images uploaded');
    expect(dialog?.textContent).toContain('Full details');
    expect(dialog?.textContent).toContain('admin');
  });

  it('loads image pages and navigates the gallery', () => {
    const api = TestBed.inject(CatalogApiService);
    const images = vi.spyOn(api, 'getProductImages')
      .mockReturnValueOnce(of({
        items: [{ id: 1, productId: 1, productName: 'Bat', url: '/one.png', sortOrder: 0 }],
        totalCount: 101, pageNumber: 1, pageSize: 100,
      }))
      .mockReturnValueOnce(of({
        items: [{ id: 2, productId: 1, productName: 'Bat', url: '/two.png', sortOrder: 1 }],
        totalCount: 101, pageNumber: 2, pageSize: 100,
      }));
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    fixture.componentInstance.openImageViewer(product);
    fixture.detectChanges();

    expect(images).toHaveBeenCalledTimes(2);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.viewer-main img')?.getAttribute('src')).toBe('/one.png');
    (element.querySelector('[aria-label="Next image"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(element.querySelector('.viewer-main img')?.getAttribute('src')).toBe('/two.png');
  });

  it('loads images for inactive products and reports broken image URLs', () => {
    const api = TestBed.inject(CatalogApiService);
    const images = vi.spyOn(api, 'getProductImages').mockReturnValue(of({
      items: [{ id: 1, productId: 1, productName: 'Bat', url: '/missing.png', sortOrder: 0 }],
      totalCount: 1, pageNumber: 1, pageSize: 100,
    }));
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    fixture.componentInstance.openImageViewer({ ...product, isActive: false });
    fixture.detectChanges();
    expect(images).toHaveBeenCalledWith(expect.objectContaining({ productId: 1, isActive: false }));
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector('.viewer-main img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(element.querySelector('.viewer-main')?.textContent).toContain('could not be loaded');
    expect(element.querySelector('.viewer-thumb')?.textContent).toContain('Unavailable');
  });

  it('shows saved product profit and loss under the gallery, not the draft prices', () => {
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    fixture.componentInstance.draft.salePrice = 999;
    fixture.componentInstance.openImageViewer(product);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const profit = element.querySelector('.details-gallery .viewer-profit')!;
    expect(profit.textContent).toContain('Profit');
    expect(profit.textContent).toContain('40.00');
    expect(profit.textContent).toContain('50.00%');
    expect(profit.textContent).toContain('100.00%');

    fixture.componentInstance.openImageViewer({ ...product, salePrice: 20, costPrice: 40 });
    fixture.detectChanges();
    expect(profit.textContent).toContain('Loss');
    expect(profit.textContent).toContain('20.00');
    expect(profit.textContent).toContain('-100.00%');
    fixture.componentInstance.openImageViewer({ ...product, salePrice: 0, costPrice: 0 });
    fixture.detectChanges();
    expect(profit.textContent).toContain('Not available');
  });

  it('starts with zero margin and shows the automatically calculated price', async () => {
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const cost = element.querySelector<HTMLInputElement>('input[name="costPrice"]')!;
    const sale = element.querySelector<HTMLInputElement>('input[name="salePrice"]')!;
    const pricingFields = Array.from(element.querySelectorAll<HTMLInputElement>('.pricing-fields input'))
      .map((field) => field.name);
    const enter = (input: HTMLInputElement, value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    expect(sale.readOnly).toBe(true);
    expect(pricingFields).toEqual(['mrp', 'costPrice', 'marginPercentage', 'discountPercentage', 'salePrice']);
    expect(fixture.componentInstance.marginPercentage).toBe(0);
    expect(element.textContent).toContain('cost price above zero');
    enter(cost, '60');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(sale.value).toBe('60');
    expect(element.querySelector('.price-calculator')?.textContent).toContain('0.00%');
    enter(cost, '0');
    expect(element.textContent).toContain('cost price above zero');
    enter(cost, '');
    expect(element.textContent).not.toContain('NaN');
  });

  it('calculates sale price from the last edited percentage and warns about losses', async () => {
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = (name: string) => element.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
    const enter = (name: string, value: string) => {
      const field = input(name);
      field.value = value;
      field.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    enter('costPrice', '70');
    enter('mrp', '200');
    enter('marginPercentage', '30');
    expect(fixture.componentInstance.draft.salePrice).toBe(100);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(input('salePrice').value).toBe('100');
    expect(fixture.componentInstance.discountPercentage).toBe(50);
    enter('costPrice', '140');
    expect(fixture.componentInstance.draft.salePrice).toBe(200);
    expect(fixture.componentInstance.discountPercentage).toBe(0);

    enter('discountPercentage', '30');
    expect(fixture.componentInstance.draft.salePrice).toBe(140);
    expect(fixture.componentInstance.marginPercentage).toBe(0);
    enter('mrp', '100');
    expect(fixture.componentInstance.draft.salePrice).toBe(70);
    expect(fixture.componentInstance.marginPercentage).toBe(-100);
    expect(element.textContent).toContain('Loss warning');
    enter('marginPercentage', '20');
    expect(fixture.componentInstance.draft.salePrice).toBe(175);
    expect(element.textContent).not.toContain('Loss warning');
    enter('mrp', '200');
    expect(fixture.componentInstance.draft.salePrice).toBe(175);
    expect(fixture.componentInstance.discountPercentage).toBe(12.5);
  });

  it('rejects invalid calculations and resets pricing state when editing a product', async () => {
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const enter = (name: string, value: string) => {
      const field = element.querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
      field.value = value;
      field.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };

    enter('marginPercentage', '30');
    expect(element.textContent).toContain('cost price above zero');
    enter('costPrice', '70');
    expect(fixture.componentInstance.draft.salePrice).toBe(100);
    enter('marginPercentage', '100');
    expect(element.textContent).toContain('Margin must be less than 100%');
    expect(fixture.componentInstance.draft.salePrice).toBe(100);
    enter('marginPercentage', '99.999999999');
    expect(element.textContent).toContain('exceeds the supported maximum');
    enter('discountPercentage', '101');
    expect(element.textContent).toContain('Discount must be between 0% and 100%');
    enter('discountPercentage', '30');
    expect(element.textContent).toContain('MRP above zero');
    enter('mrp', '100');
    expect(fixture.componentInstance.draft.salePrice).toBe(70);
    enter('discountPercentage', '100');
    expect(fixture.componentInstance.draft.salePrice).toBe(0);
    expect(element.textContent).toContain('Loss warning');

    element.querySelector<HTMLElement>('.editor-card')!.scrollIntoView = vi.fn();
    fixture.componentInstance.edit(product);
    fixture.detectChanges();
    expect(fixture.componentInstance.calculationError).toBe('');
    expect(fixture.componentInstance.marginPercentage).toBe(50);
    expect(fixture.componentInstance.discountPercentage).toBe(20);
    enter('mrp', '200');
    expect(fixture.componentInstance.draft.salePrice).toBe(80);
    expect(fixture.componentInstance.discountPercentage).toBe(60);
    fixture.componentInstance.startCreate();
    expect(fixture.componentInstance.marginPercentage).toBe(0);
    expect(fixture.componentInstance.discountPercentage).toBeNull();
  });

  it('retains existing precision until the percentage is explicitly edited', async () => {
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLElement>('.editor-card')!.scrollIntoView = vi.fn();
    fixture.componentInstance.edit({ ...product, salePrice: 3, costPrice: 2 });
    expect(fixture.componentInstance.draft.salePrice).toBe(3);
    const cost = element.querySelector<HTMLInputElement>('input[name="costPrice"]')!;
    cost.value = '4';
    cost.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.componentInstance.draft.salePrice).toBe(6);
  });

  it('requires a new percentage after clearing the active calculation', async () => {
    const fixture = TestBed.createComponent(ProductManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const cost = element.querySelector<HTMLInputElement>('input[name="costPrice"]')!;
    cost.value = '70';
    cost.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const margin = element.querySelector<HTMLInputElement>('input[name="marginPercentage"]')!;
    margin.value = '';
    margin.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.textContent).toContain('Enter a margin or discount');
    expect(fixture.componentInstance.calculationError).toBeTruthy();
  });
});
