import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { Product } from '../../core/models/catalog.models';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { StorefrontPlaceholderComponent } from './storefront-placeholder.component';

describe('category product page', () => {
  const product = (id: number, categoryId: number, brandId: number): Product => ({
    id, categoryId, brandId, name: `Product ${id}`, slug: `product-${id}`, sku: `SKU-${id}`,
    mrp: 500, salePrice: id * 100, costPrice: 50, discountPct: 0, shortDesc: null,
    description: null, stock: 1, avgRating: 0, reviewCount: 0, salesCount: 0,
    sortOrder: 0, metaTitle: null, metaDesc: null, isActive: true, hasImage: true, isPublished: true, createdAt: `2026-01-0${id}`,
    updatedAt: '', createdBy: null,
  });
  const category = (id: number, parentId: number | null) =>
    ({ id, parentId, name: `Category ${id}`, slug: `category-${id}`, sortOrder: id, isActive: true });
  const api = {
    getProducts: () => of({ items: [product(1, 1, 1), product(2, 2, 1), product(3, 3, 2), product(4, 4, 2)], totalCount: 4, pageNumber: 1, pageSize: 100 }),
    getCategories: () => of([{ ...category(1, null), children: [category(2, 1), category(3, 2)] }, category(4, null)]),
    getBrands: () => of([{ id: 1, name: 'Brand A', isActive: true }, { id: 2, name: 'Brand B', isActive: true }]),
    getProductImages: () => of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 1 }),
    resolveAssetUrl: (url: string) => url,
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'cricket', component: StorefrontPlaceholderComponent },
          { path: 'cricket/category/:id', component: StorefrontPlaceholderComponent },
        ]),
        { provide: CatalogApiService, useValue: api },
      ],
    });
  });

  it('navigates from category links on the cricket page', async () => {
    const harness = await RouterTestingHarness.create('/cricket');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    const link = element.querySelector<HTMLAnchorElement>('a.category-option')!;
    expect(link.getAttribute('href')).toBe('/cricket/category/1');
    expect(link.textContent).toContain('Category 1');
    expect(link.textContent).toContain('3');
    expect(element.querySelector('.main-categories input[type=radio]')).toBeNull();
    link.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/cricket/category/1');
    expect((harness.routeNativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('Category 1');
  });

  it('opens a category page and combines multiple brand and subcategory filters', async () => {
    const harness = await RouterTestingHarness.create('/cricket/category/1');
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/cricket/category/1');
    const element = harness.routeNativeElement as HTMLElement;
    const component = harness.routeDebugElement!.componentInstance as StorefrontPlaceholderComponent;
    expect(element.querySelector('h1')?.textContent).toContain('Category 1');
    expect(element.querySelector('.filters-title h2')?.textContent).toContain('Filter by');
    expect(element.querySelector('.shopping-heading h3')?.textContent).toContain('Shopping options');
    expect(component.filteredProducts.map(item => item.id)).toEqual([3, 2, 1]);
    expect(element.querySelectorAll('.subcategory-option')).toHaveLength(2);
    const brandInputs = element.querySelectorAll<HTMLInputElement>('fieldset input[type=checkbox]');
    const brands = [...brandInputs].filter(input => input.parentElement?.textContent?.includes('Brand'));
    expect(brands).toHaveLength(2);
    brands[0].click(); fixtureChange(harness);
    expect(component.filteredProducts.map(item => item.id)).toEqual([2, 1]);
    brands[1].click(); fixtureChange(harness);
    expect(component.filteredProducts.map(item => item.id)).toEqual([3, 2, 1]);
    component.setSubcategorySelected(2, true); fixtureChange(harness);
    expect(component.filteredProducts.map(item => item.id)).toEqual([3, 2]);
    brands[0].click(); fixtureChange(harness);
    expect(component.filteredProducts.map(item => item.id)).toEqual([3]);
    brands[1].click(); fixtureChange(harness);
    expect(component.filteredProducts.map(item => item.id)).toEqual([3, 2]);
    component.minPrice = 400;
    fixtureChange(harness);
    expect(component.filteredProducts).toHaveLength(0);
    component.clearFilters(); fixtureChange(harness);
    expect(component.filteredProducts.map(item => item.id)).toEqual([3, 2, 1]);
    expect(component.selectedBrandIds.size).toBe(0);
    expect(component.selectedSubcategoryIds.size).toBe(0);
  });

  it('initializes a brand query on the category page and allows clearing it', async () => {
    const harness = await RouterTestingHarness.create('/cricket/category/1?brand=2');
    harness.detectChanges();
    const component = harness.routeDebugElement!.componentInstance as StorefrontPlaceholderComponent;
    expect(component.filteredProducts.map(item => item.id)).toEqual([3]);
    const brand = [...(harness.routeNativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[type=checkbox]')]
      .find(input => input.parentElement?.textContent?.includes('Brand B'))!;
    expect(brand.checked).toBe(true);
    brand.click();
    harness.detectChanges();
    expect(component.filteredProducts.map(item => item.id)).toEqual([3, 2, 1]);
  });

  it('only offers active brands with active products in the category or descendants', async () => {
    vi.spyOn(api, 'getProducts').mockReturnValue(of({
      items: [product(1, 1, 1), product(2, 3, 2), product(3, 4, 3),
        { ...product(4, 1, 4), isActive: false }, product(5, 1, 5)],
      totalCount: 5, pageNumber: 1, pageSize: 100,
    }));
    vi.spyOn(api, 'getBrands').mockReturnValue(of([
      { id: 1, name: 'Brand A', isActive: true }, { id: 2, name: 'Brand B', isActive: true },
      { id: 3, name: 'Brand C', isActive: true }, { id: 4, name: 'Brand D', isActive: true },
      { id: 5, name: 'Brand E', isActive: false },
    ]));
    const harness = await RouterTestingHarness.create('/cricket/category/1');
    harness.detectChanges();
    const component = harness.routeDebugElement!.componentInstance as StorefrontPlaceholderComponent;
    expect(component.availableBrands.map(brand => brand.name)).toEqual(['Brand A', 'Brand B']);
    component.setBrandSelected(1, true);
    component.setSubcategorySelected(2, true);
    harness.detectChanges();
    expect(component.availableBrands.map(brand => brand.name)).toEqual(['Brand A', 'Brand B']);
    await harness.navigateByUrl('/cricket/category/4');
    harness.detectChanges();
    const newComponent = harness.routeDebugElement!.componentInstance as StorefrontPlaceholderComponent;
    expect(newComponent.availableBrands.map(brand => brand.name)).toEqual(['Brand C']);
    vi.restoreAllMocks();
  });

  it('explains empty brands and unavailable brand links without silently clearing the filter', async () => {
    const harness = await RouterTestingHarness.create('/cricket/category/4?brand=1');
    harness.detectChanges();
    let element = harness.routeNativeElement as HTMLElement;
    expect(element.textContent).toContain('A selected brand has no active products');
    expect(element.querySelectorAll('.product-card')).toHaveLength(0);
    element.querySelector<HTMLButtonElement>('.shopping-heading button')!.click();
    harness.detectChanges();
    expect(element.querySelectorAll('.product-card')).toHaveLength(1);
    expect(element.textContent).not.toContain('A selected brand has no active products');
    vi.spyOn(api, 'getProducts').mockReturnValue(of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 100 }));
    await harness.navigateByUrl('/cricket/category/1');
    (harness.routeDebugElement!.componentInstance as StorefrontPlaceholderComponent).loadCatalog();
    harness.detectChanges();
    element = harness.routeNativeElement as HTMLElement;
    expect(element.textContent).toContain('No brands with active products in this category.');
    vi.restoreAllMocks();
  });

  it('handles invalid and nested category URLs without exposing unrelated products', async () => {
    const harness = await RouterTestingHarness.create('/cricket/category/2');
    harness.detectChanges();
    const component = harness.routeDebugElement!.componentInstance as StorefrontPlaceholderComponent;
    expect(component.filteredProducts.map(item => item.id)).toEqual([3, 2]);
    expect((harness.routeNativeElement as HTMLElement).querySelectorAll('.subcategory-option')).toHaveLength(1);
    component.clearFilters();
    expect(component.filteredProducts.map(item => item.id)).toEqual([3, 2]);
    await harness.navigateByUrl('/cricket/category/999');
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Category not found');
    expect((harness.routeNativeElement as HTMLElement).querySelectorAll('.product-card')).toHaveLength(0);
    await harness.navigateByUrl('/cricket/category/invalid');
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Category not found');
  });
});

function fixtureChange(harness: RouterTestingHarness): void {
  harness.detectChanges();
}
