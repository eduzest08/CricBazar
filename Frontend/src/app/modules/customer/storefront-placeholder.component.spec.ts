import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Brand, Category, PaginatedResponse, Product, ProductImage } from '../../core/models/catalog.models';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { StorefrontPlaceholderComponent } from './storefront-placeholder.component';

describe('customer catalog', () => {
  const product = (id: number, categoryId = 2, brandId = 1): Product => ({
    id, name: `Product ${id}`, slug: `product-${id}`, sku: `SKU-${id}`, categoryId, brandId,
    mrp: 1000, salePrice: id * 100, costPrice: 50, discountPct: 0, shortDesc: null,
    description: null, stock: 5, avgRating: 0, reviewCount: 0, salesCount: 0, sortOrder: 0,
    metaTitle: null, metaDesc: null, isActive: true, hasImage: true, isPublished: true, createdAt: `2026-01-${String(id).padStart(2, '0')}`,
    updatedAt: '', createdBy: null,
  });
  const category = (id: number, parentId: number | null): Category =>
    ({ id, parentId, name: `Category ${id}`, slug: `cat-${id}`, sortOrder: id, isActive: true });
  const page = <T>(items: T[], pageNumber = 1, totalCount = items.length, pageSize = 100): PaginatedResponse<T> =>
    ({ items, pageNumber, totalCount, pageSize });
  const image = (productId: number): ProductImage =>
    ({ id: productId, productId, productName: '', productIsPublished: true, url: `/uploads/${productId}.jpg`, sortOrder: 0 });
  const api = {
    getProducts: vi.fn(),
    getCategories: vi.fn(),
    getBrands: vi.fn(),
    getProductImages: vi.fn(),
    resolveAssetUrl: (url: string) => `http://api.test${url}`,
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    api.getProducts.mockReturnValue(of(page([product(1), product(2, 3, 2), product(3, 4, 1)])));
    api.getCategories.mockReturnValue(of([{ ...category(1, null), children: [category(2, 1), category(3, 2)] }, category(4, null)]));
    api.getBrands.mockReturnValue(of([
      { id: 1, name: 'Brand A', slug: 'a', logoUrl: null, isActive: true },
      { id: 2, name: 'Brand B', slug: 'b', logoUrl: null, isActive: true },
      { id: 3, name: 'Inactive', slug: 'inactive', logoUrl: null, isActive: false },
    ] satisfies Brand[]));
    api.getProductImages.mockImplementation((query: { productId: number }) => of(page([image(query.productId)], 1, 1, 1)));
    await TestBed.configureTestingModule({
      imports: [StorefrontPlaceholderComponent],
      providers: [provideRouter([]), { provide: CatalogApiService, useValue: api }],
    }).compileComponents();
  });

  it('loads all product pages and displays active products with their main images', () => {
    api.getProducts.mockImplementation((_search: string, pageNumber: number) =>
      of(page([pageNumber === 1 ? product(1) : pageNumber === 2 ? product(2) : { ...product(3), isActive: false }], pageNumber, 3, 1)));
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(api.getProducts).toHaveBeenCalledTimes(3);
    expect(element.querySelectorAll('.product-card')).toHaveLength(2);
    expect(element.querySelector<HTMLImageElement>('img[alt="Product 2"]')?.src).toBe('http://api.test/uploads/2.jpg');
    expect(element.querySelector<HTMLAnchorElement>('.product-link')?.getAttribute('href')).toBe('/cricket/product/2');
    expect(api.getProductImages).toHaveBeenCalledWith(expect.objectContaining({ productId: 2, pageSize: 1, sortBy: 'sortOrder', sortDirection: 'asc', isActive: true }));
    expect(element.textContent).not.toContain('Inactive');
  });

  it('adds a catalog product to the shared cart', () => {
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.add-to-cart')!.click();
    fixture.detectChanges();

    expect(element.querySelector('[role=status]')?.textContent).toContain('added to cart');
    expect(element.querySelector('.cart-toggle')?.textContent).toContain('Your Cart (1)');
  });

  it('displays the supplied logo in the header and footer', () => {
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const headerLink = element.querySelector<HTMLAnchorElement>('.brand')!;
    expect(headerLink.getAttribute('href')).toBe('/');
    expect(headerLink.querySelector('img')?.getAttribute('src')).toBe('/storefront-logo.png');
    expect(element.querySelector('footer img')?.getAttribute('src')).toBe('/storefront-logo.png');
    expect(element.querySelector('footer img')?.getAttribute('alt')).toBe('CricDynamics - Power your play');
    expect(element.querySelector('app-storefront-footer footer')).not.toBeNull();
  });

  it('filters descendants, brands, prices and search, and sorts results', () => {
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.setCategorySelected(1, true);
    expect(component.filteredProducts.map(item => item.id)).toEqual([2, 1]);
    component.brandId = 2;
    expect(component.filteredProducts.map(item => item.id)).toEqual([2]);
    component.brandId = null;
    component.minPrice = 150;
    expect(component.filteredProducts.map(item => item.id)).toEqual([2]);
    component.clearFilters();
    component.searchInput = 'SKU-1';
    component.search();
    expect(component.filteredProducts.map(item => item.id)).toEqual([1]);
    component.clearFilters();
    component.sortBy = 'price_asc';
    expect(component.filteredProducts.map(item => item.id)).toEqual([1, 2, 3]);
    component.minPrice = 500;
    component.maxPrice = 100;
    fixture.detectChanges();
    expect(component.priceInvalid).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.product-card')).toHaveLength(0);
  });

  it('submits the shared header search while retaining category selection', async () => {
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.setCategorySelected(1, true);
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('#catalog-search')!;
    input.value = 'SKU-2';
    input.dispatchEvent(new Event('input'));
    element.querySelector<HTMLFormElement>('.search')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(component.selectedCategoryIds.has(1)).toBe(true);
    expect(component.filteredProducts.map(item => item.id)).toEqual([2]);
  });

  it('shows main category links and counts', () => {
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;
    const options = element.querySelectorAll<HTMLElement>('.category-option');
    expect([...options].map(option => option.querySelector('.category-name')?.textContent?.trim())).toEqual(['Category 1', 'Category 4']);
    expect([...options].map(option => option.querySelector('.category-count')?.textContent?.trim())).toEqual(['2', '1']);
    expect(element.querySelectorAll('.category-option input[type=radio]')).toHaveLength(0);
    expect([...element.querySelectorAll<HTMLAnchorElement>('a.category-option')].map(link => link.getAttribute('href')))
      .toEqual(['/cricket/category/1', '/cricket/category/4']);
    expect(element.querySelector('.filters-title h2')?.textContent).toContain('Filter by');
    expect(element.querySelector('.shopping-heading h3')?.textContent).toContain('Shopping options');
    expect(element.querySelectorAll('.filters input[type=checkbox], .filters input[type=number]')).toHaveLength(0);
    component.pageSize = 1;
    component.changePage(2);
    component.setCategorySelected(1, true);
    expect(component.page).toBe(1);
    expect(component.filteredProducts.map(item => item.id)).toEqual([2, 1]);
    component.setCategorySelected(4, true);
    expect(component.filteredProducts.map(item => item.id)).toEqual([3, 2, 1]);
    component.setCategorySelected(1, false);
    expect(component.filteredProducts.map(item => item.id)).toEqual([3]);
    component.setCategorySelected(4, false);
    expect(component.filteredProducts.map(item => item.id)).toEqual([3, 2, 1]);
    component.setCategorySelected(1, true);
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.shopping-heading button')!.click();
    fixture.detectChanges();
    expect(component.filteredProducts).toHaveLength(3);
    component.setCategorySelected(1, true);
    component.clearFilters();
    expect(component.selectedCategoryIds.size).toBe(0);
  });

  it('counts all active products including descendants, regardless of other filters', () => {
    api.getProducts.mockReturnValue(of(page([product(1, 1), product(2, 2), product(3, 3), { ...product(4, 1), isActive: false }])));
    api.getCategories.mockReturnValue(of([{ ...category(1, null), children: [category(2, 1), category(3, 2)] }, category(4, null)]));
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;
    expect([...element.querySelectorAll('.category-count')].map(count => count.textContent?.trim())).toEqual(['3', '0']);
    component.searchInput = 'SKU-2';
    component.search();
    component.brandId = 2;
    fixture.detectChanges();
    expect([...element.querySelectorAll('.category-count')].map(count => count.textContent?.trim())).toEqual(['3', '0']);
  });

  it('combines subcategory selections within each selected main category', () => {
    api.getCategories.mockReturnValue(of([
      { ...category(1, null), children: [category(2, 1), category(3, 2), category(5, 1)] },
      { ...category(4, null), children: [category(6, 4), category(7, 4)] },
    ]));
    api.getProducts.mockReturnValue(of(page([
      product(1, 1), product(2, 2), product(3, 3), product(4, 5),
      product(5, 4), product(6, 6), product(7, 7),
    ])));
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const component = fixture.componentInstance;
    expect(element.querySelectorAll('.subcategory-option')).toHaveLength(0);
    expect(element.textContent).toContain('Filter by');
    component.setCategorySelected(1, true);
    fixture.detectChanges();
    expect(component.filteredProducts.map(item => item.id)).toEqual([4, 3, 2, 1]);
    expect(component.subcategoryOptions.map(item => item.category.name)).toEqual(['Category 2', 'Category 3', 'Category 5']);
    component.setSubcategorySelected(2, true);
    fixture.detectChanges();
    expect(component.filteredProducts.map(item => item.id)).toEqual([3, 2]);
    component.setSubcategorySelected(5, true);
    fixture.detectChanges();
    expect(component.filteredProducts.map(item => item.id)).toEqual([4, 3, 2]);
    component.setCategorySelected(4, true);
    fixture.detectChanges();
    expect(component.filteredProducts.map(item => item.id)).toEqual([7, 6, 5, 4, 3, 2]);
    component.setSubcategorySelected(6, true);
    fixture.detectChanges();
    expect(component.filteredProducts.map(item => item.id)).toEqual([6, 4, 3, 2]);
    component.brandId = 2;
    expect(component.filteredProducts).toHaveLength(0);
    component.brandId = null;
    component.setSubcategorySelected(6, false);
    fixture.detectChanges();
    expect(component.filteredProducts.map(item => item.id)).toEqual([7, 6, 5, 4, 3, 2]);
    component.clearCategories();
    fixture.detectChanges();
    expect(component.filteredProducts).toHaveLength(7);
    expect(component.selectedSubcategoryIds.size).toBe(0);
    expect(element.querySelectorAll('.subcategory-option')).toHaveLength(0);
  });

  it('paginates, switches display mode and resets page on filter change', () => {
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.pageSize = 2;
    component.filterChanged();
    component.changePage(2);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(component.visibleProducts.map(item => item.id)).toEqual([1]);
    expect(element.textContent).toContain('Page 2 of 2');
    element.querySelector<HTMLButtonElement>('[aria-label="List view"]')!.click();
    fixture.detectChanges();
    expect(element.querySelector('.product-grid.list-view')).not.toBeNull();
    component.filterChanged();
    expect(component.page).toBe(1);
  });

  it('surfaces catalog and image failures and permits retry', () => {
    api.getProducts.mockReturnValueOnce(throwError(() => new Error('Catalog unavailable')));
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Catalog unavailable');
    api.getProductImages.mockReturnValueOnce(throwError(() => new Error('Image error')));
    element.querySelector<HTMLButtonElement>('.notice button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Some product images could not be loaded');
    expect(element.querySelectorAll('.product-card')).toHaveLength(3);
  });

  it('reports an incomplete product catalog instead of displaying partial results', () => {
    api.getProducts.mockReturnValueOnce(of(page([product(1)], 1, 3, 1)))
      .mockReturnValueOnce(of(page([], 2, 3, 1)));
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('catalog changed while loading');
    expect(element.querySelectorAll('.product-card')).toHaveLength(0);
  });

  it('cancels stale image requests when filters change', () => {
    const pending = new Subject<PaginatedResponse<ProductImage>>();
    api.getProductImages.mockReturnValueOnce(pending);
    const fixture = TestBed.createComponent(StorefrontPlaceholderComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.searchInput = 'SKU-1';
    component.search();
    pending.next(page([image(3)]));
    pending.complete();
    expect([...component.images.keys()]).toEqual([1]);
    expect(component.imageLoading).toBe(false);
  });
});
