import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { Product } from '../../core/models/catalog.models';
import { StorefrontHomeComponent } from './storefront-home.component';
import { StorefrontPlaceholderComponent } from './storefront-placeholder.component';
import { StorefrontProductComponent } from './storefront-product.component';

describe('customer home', () => {
  const product = (id: number, categoryId: number, brandId: number): Product => ({
    id, name: `Product ${id}`, slug: `product-${id}`, sku: `SKU-${id}`, categoryId, brandId,
    mrp: 1000, salePrice: id * 100, costPrice: 50, discountPct: 0, shortDesc: null,
    description: null, stock: 5, avgRating: 0, reviewCount: 0, salesCount: 0, sortOrder: 0,
    metaTitle: null, metaDesc: null, isActive: true, hasImage: true, isPublished: true, createdAt: `2026-01-0${id}`,
    updatedAt: '', createdBy: null,
  });
  const api = {
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    getCategories: vi.fn(),
    getBrands: vi.fn(),
    getProductImages: vi.fn(),
    getProductAttributes: vi.fn(),
    resolveAssetUrl: (url: string) => `http://api.test${url}`,
  };
  beforeEach(() => {
    vi.resetAllMocks();
    api.getProducts.mockReturnValue(of({ items: [product(1, 2, 1), product(2, 3, 2)], totalCount: 2, pageNumber: 1, pageSize: 100 }));
    api.getProduct.mockImplementation((id: number) => of(product(id, 2, 1)));
    api.getProductAttributes.mockReturnValue(of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 100 }));
    api.getCategories.mockReturnValue(of([
      { id: 1, parentId: null, name: 'Bat', slug: 'bat', sortOrder: 1, isActive: true,
        children: [{ id: 2, parentId: 1, name: 'Willow', slug: 'willow', sortOrder: 1, isActive: true }] },
      { id: 3, parentId: null, name: 'Ball', slug: 'ball', sortOrder: 2, isActive: true },
    ]));
    api.getBrands.mockReturnValue(of([
      { id: 1, name: 'Brand A', slug: 'a', logoUrl: null, isActive: true },
      { id: 2, name: 'Brand B', slug: 'b', logoUrl: null, isActive: true },
    ]));
    api.getProductImages.mockImplementation((query: { productId: number }) =>
      of({ items: [{ id: query.productId, productId: query.productId, url: `/image-${query.productId}.png`, sortOrder: 0 }], totalCount: 1, pageNumber: 1, pageSize: 1 }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', pathMatch: 'full', component: StorefrontHomeComponent },
          { path: 'cricket', component: StorefrontPlaceholderComponent },
          { path: 'cricket/category/:id', component: StorefrontPlaceholderComponent },
          { path: 'cricket/product/:id', component: StorefrontProductComponent },
        ]),
        { provide: CatalogApiService, useValue: api },
      ],
    });
  });

  it('shows active categories, brands and best-selling product images', async () => {
    const harness = await RouterTestingHarness.create('/');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(api.getProducts).toHaveBeenCalledWith('', 1, 8, 'bestselling', true, undefined, true, true);
    expect(element.querySelectorAll('.category-card')).toHaveLength(2);
    expect(element.querySelectorAll('.brands a')).toHaveLength(2);
    expect(element.querySelectorAll('.product-card')).toHaveLength(2);
    expect(element.querySelector<HTMLImageElement>('.product-image img')?.src).toBe('http://api.test/image-1.png');
    expect(element.querySelector('app-storefront-footer footer')).not.toBeNull();
  });

  it('does not show products awaiting an image', async () => {
    api.getProducts.mockReturnValue(of({
      items: [product(1, 2, 1), { ...product(2, 3, 2), hasImage: false }],
      totalCount: 2, pageNumber: 1, pageSize: 100,
    }));
    const harness = await RouterTestingHarness.create('/');
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).querySelectorAll('.product-card')).toHaveLength(1);
  });

  it('opens the catalog with the selected parent category, including descendants', async () => {
    const harness = await RouterTestingHarness.create('/');
    harness.detectChanges();
    (harness.routeNativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.category-card')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(element.querySelectorAll('.product-card')).toHaveLength(1);
    expect(element.textContent).toContain('Product 1');
    expect(element.querySelector('h1')?.textContent).toContain('Bat');
    expect(element.querySelectorAll('.subcategory-option')).toHaveLength(1);
  });

  it('retains a subcategory link and indicates it in the main category filter', async () => {
    const harness = await RouterTestingHarness.create('/cricket?category=2');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(element.querySelector<HTMLInputElement>('.category-option input')?.checked).toBe(true);
    expect(element.querySelectorAll('.product-card')).toHaveLength(1);
    element.querySelector<HTMLButtonElement>('.shopping-heading button')!.click();
    harness.detectChanges();
    expect(element.querySelectorAll('.product-card')).toHaveLength(2);
  });

  it('opens the catalog with a brand filter and product details from the home page', async () => {
    const harness = await RouterTestingHarness.create('/');
    harness.detectChanges();
    (harness.routeNativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.brands a')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Product 1');
    expect((harness.routeDebugElement!.componentInstance as StorefrontPlaceholderComponent).brandId).toBe(1);
    expect((harness.routeNativeElement as HTMLElement).querySelectorAll('.product-card')).toHaveLength(1);
    (harness.routeNativeElement as HTMLElement).querySelector<HTMLButtonElement>('.shopping-heading button')!.click();
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).querySelectorAll('.product-card')).toHaveLength(2);
    await harness.navigateByUrl('/');
    harness.detectChanges();
    (harness.routeNativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.product-link')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(api.getProduct).toHaveBeenCalledWith(1);
    expect((harness.routeNativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('Product 1');
  });

  it('searches from the shared header and marks upcoming actions unavailable', async () => {
    const harness = await RouterTestingHarness.create('/');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    const actions = element.querySelectorAll<HTMLButtonElement>('.header-actions button');
    expect(actions).toHaveLength(3);
    expect(actions[0].disabled && actions[0].textContent?.includes('Coming soon')).toBe(true);
    expect(actions[1].disabled && actions[1].textContent?.includes('Coming soon')).toBe(true);
    expect(actions[2].disabled).toBe(false);
    expect(actions[2].textContent).toContain('Your Cart (0)');
    const input = element.querySelector<HTMLInputElement>('#catalog-search')!;
    input.value = 'SKU-1';
    input.dispatchEvent(new Event('input'));
    element.querySelector<HTMLFormElement>('.search')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
    const catalog = harness.routeNativeElement as HTMLElement;
    expect(catalog.querySelector<HTMLInputElement>('#catalog-search')?.value).toBe('SKU-1');
    expect(catalog.querySelectorAll('.product-card')).toHaveLength(1);
    expect(catalog.textContent).toContain('Product 1');
  });

  it('shows errors and retries without hiding failures', async () => {
    api.getBrands.mockReturnValueOnce(throwError(() => new Error('Brands unavailable')));
    const harness = await RouterTestingHarness.create('/');
    harness.detectChanges();
    let element = harness.routeNativeElement as HTMLElement;
    expect(element.querySelector('[role=alert]')?.textContent).toContain('Brands unavailable');
    api.getProductImages.mockReturnValueOnce(throwError(() => new Error('Images unavailable')));
    element.querySelector<HTMLButtonElement>('.notice button')!.click();
    harness.detectChanges();
    element = harness.routeNativeElement as HTMLElement;
    expect(element.querySelector('[role=alert]')?.textContent).toContain('Some product images could not be loaded');
  });
});
