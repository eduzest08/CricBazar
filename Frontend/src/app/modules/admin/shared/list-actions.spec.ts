import { TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';
import { of } from 'rxjs';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { BrandManagementComponent } from '../brands/brand-management.component';
import { CategoryManagementComponent } from '../categories/category-management.component';
import { ProductManagementComponent } from '../products/product-management.component';
import { ProductAttributesComponent } from '../product-attributes/product-attributes.component';
import { ProductImagesComponent } from '../product-images/product-images.component';
import { ProductVariantsComponent } from '../product-variants/product-variants.component';
import { ReviewsComponent } from '../reviews/reviews.component';

describe('admin list action icons', () => {
  const emptyPage = { items: [], totalCount: 0, pageNumber: 1, pageSize: 10 };
  const api = {
    getBrandsPage: () => of(emptyPage),
    getProductAttributes: () => of(emptyPage),
    getProductImages: () => of(emptyPage),
    getProductVariants: () => of(emptyPage),
    getReviews: () => of(emptyPage),
    getProducts: () => of(emptyPage),
    getCategories: () => of([]),
    getBrands: () => of([]),
    resolveAssetUrl: (url: string) => url,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: CatalogApiService, useValue: api }] });
  });

  function clickAction(element: HTMLElement, label: string): void {
    const button = element.querySelector<HTMLButtonElement>(`.actions button[aria-label="${label}"]`);
    expect(button).not.toBeNull();
    expect(button!.title).not.toBe('');
    expect(button!.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(button!.textContent?.trim()).toBe('');
    button!.click();
  }

  function selectItem(element: HTMLElement, label: string): void {
    const checkbox = element.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
    expect(checkbox).not.toBeNull();
    checkbox!.click();
    expect(checkbox!.checked).toBe(true);
  }

  it.each([
    ['brands', BrandManagementComponent, 'Entry', 'List'],
    ['categories', CategoryManagementComponent, 'Entry', 'List'],
    ['attributes', ProductAttributesComponent, 'Entry', 'List'],
    ['variants', ProductVariantsComponent, 'Entry', 'List'],
    ['images', ProductImagesComponent, 'Entry', 'List'],
    ['reviews', ReviewsComponent, 'Entry', 'List'],
    ['products', ProductManagementComponent, 'Product entry', 'Product catalog'],
  ] as [string, Type<object>, string, string][])('shows decorative icons and text on %s management tabs', (_page, component, entry, list) => {
    const fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('.management-tabs [role="tab"]') as NodeListOf<HTMLButtonElement>;
    expect(tabs).toHaveLength(2);
    expect(tabs[0].textContent?.trim()).toBe(entry);
    expect(tabs[1].textContent?.trim()).toBe(list);
    expect(tabs[0].querySelector('app-action-icon[name="entry"] svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(tabs[1].querySelector('app-action-icon[name="list"] svg')?.getAttribute('aria-hidden')).toBe('true');
    tabs[0].click();
    fixture.detectChanges();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    tabs[1].click();
    fixture.detectChanges();
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });

  it('renders brand edit and delete actions', () => {
    const fixture = TestBed.createComponent(BrandManagementComponent);
    vi.spyOn(fixture.componentInstance, 'loadBrands').mockImplementation(() => {});
    const item = { id: 1, name: 'Brand', slug: 'brand', logoUrl: null, isActive: true };
    fixture.componentInstance.brands = [item];
    const edit = vi.spyOn(fixture.componentInstance, 'edit').mockImplementation(() => {});
    const remove = vi.spyOn(fixture.componentInstance, 'delete');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    selectItem(fixture.nativeElement, 'Select Brand');
    clickAction(fixture.nativeElement, 'Edit Brand');
    clickAction(fixture.nativeElement, 'Delete Brand');
    expect(edit).toHaveBeenCalledWith(item);
    expect(remove).toHaveBeenCalledWith(item);
  });

  it('renders attribute edit and delete actions', () => {
    const fixture = TestBed.createComponent(ProductAttributesComponent);
    vi.spyOn(fixture.componentInstance, 'loadAttributes').mockImplementation(() => {});
    const item = { id: 1, productId: 1, productName: 'Bat', name: 'Wood', value: 'Willow' };
    fixture.componentInstance.attributes = [item];
    const edit = vi.spyOn(fixture.componentInstance, 'edit').mockImplementation(() => {});
    const remove = vi.spyOn(fixture.componentInstance, 'delete');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    selectItem(fixture.nativeElement, 'Select attribute Wood for Bat');
    clickAction(fixture.nativeElement, 'Edit attribute Wood for Bat');
    clickAction(fixture.nativeElement, 'Delete attribute Wood for Bat');
    expect(edit).toHaveBeenCalledWith(item);
    expect(remove).toHaveBeenCalledWith(item);
  });

  it('renders variant edit and delete actions', () => {
    const fixture = TestBed.createComponent(ProductVariantsComponent);
    vi.spyOn(fixture.componentInstance, 'loadVariants').mockImplementation(() => {});
    const item = { id: 2, productId: 1, productName: 'Bat', size: 'L', color: null, hand: null, stock: 1, priceOverride: null };
    fixture.componentInstance.variants = [item];
    const edit = vi.spyOn(fixture.componentInstance, 'edit').mockImplementation(() => {});
    const remove = vi.spyOn(fixture.componentInstance, 'delete');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    selectItem(fixture.nativeElement, 'Select variant 2 for Bat');
    clickAction(fixture.nativeElement, 'Edit variant 2 for Bat');
    clickAction(fixture.nativeElement, 'Delete variant 2 for Bat');
    expect(edit).toHaveBeenCalledWith(item);
    expect(remove).toHaveBeenCalledWith(item);
  });

  it('renders image view, edit and delete actions', () => {
    const fixture = TestBed.createComponent(ProductImagesComponent);
    vi.spyOn(fixture.componentInstance, 'loadImages').mockImplementation(() => {});
    const item = { id: 3, productId: 1, productName: 'Bat', productIsPublished: false, url: '/example.png', sortOrder: 0 };
    fixture.componentInstance.images = [item];
    const view = vi.spyOn(fixture.componentInstance, 'previewInViewer').mockImplementation(() => {});
    const edit = vi.spyOn(fixture.componentInstance, 'edit').mockImplementation(() => {});
    const remove = vi.spyOn(fixture.componentInstance, 'delete');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('dialog').showModal = vi.fn();
    clickAction(fixture.nativeElement, 'View images for Bat');
    clickAction(fixture.nativeElement, 'Edit main image for Bat');
    clickAction(fixture.nativeElement, 'Delete main image for Bat');
    fixture.nativeElement.querySelector('[aria-label="Expand Bat images"]').click();
    fixture.detectChanges();
    selectItem(fixture.nativeElement, 'Select image 3 for Bat');
    clickAction(fixture.nativeElement, 'Edit image 3 for Bat');
    clickAction(fixture.nativeElement, 'Delete image 3 for Bat');
    expect(view).toHaveBeenCalledWith(item);
    expect(edit).toHaveBeenCalledWith(item);
    expect(remove).toHaveBeenCalledWith(item);
  });

  it('renders review edit and delete actions', () => {
    const fixture = TestBed.createComponent(ReviewsComponent);
    vi.spyOn(fixture.componentInstance, 'loadReviews').mockImplementation(() => {});
    const item = { id: 4, productId: 1, productName: 'Bat', userId: 1, userName: 'User', rating: 5, comment: null, createdAt: '2026-01-01' };
    fixture.componentInstance.reviews = [item];
    const edit = vi.spyOn(fixture.componentInstance, 'edit').mockImplementation(() => {});
    const remove = vi.spyOn(fixture.componentInstance, 'delete');
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    selectItem(fixture.nativeElement, 'Select review 4 for Bat');
    clickAction(fixture.nativeElement, 'Edit review 4 for Bat');
    clickAction(fixture.nativeElement, 'Delete review 4 for Bat');
    expect(edit).toHaveBeenCalledWith(item);
    expect(remove).toHaveBeenCalledWith(item);
  });
});
