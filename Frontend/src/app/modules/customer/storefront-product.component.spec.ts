import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { Product } from '../../core/models/catalog.models';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { StorefrontProductComponent } from './storefront-product.component';

describe('storefront product details', () => {
  const product: Product = {
    id: 1, name: 'Cricket bat', slug: 'cricket-bat', sku: 'BAT-1', categoryId: 1, brandId: 1,
    mrp: 1000, salePrice: 800, costPrice: 500, discountPct: 20, shortDesc: 'Lightweight',
    description: 'Made for cricket', stock: 5, avgRating: 4.5, reviewCount: 2, salesCount: 0,
    sortOrder: 0, metaTitle: null, metaDesc: null, isActive: true, createdAt: '', updatedAt: '', createdBy: null,
  };
  const api = {
    getProduct: vi.fn(),
    getProductImages: vi.fn(),
    getProductAttributes: vi.fn(),
    resolveAssetUrl: (url: string) => `http://api.test${url}`,
  };
  const page = <T>(items: T[], pageNumber = 1, totalCount = items.length, pageSize = 100) =>
    ({ items, pageNumber, totalCount, pageSize });
  const image = (id: number) => ({ id, productId: 1, productName: 'Cricket bat', url: `/image-${id}.jpg`, sortOrder: id });

  beforeEach(() => {
    vi.resetAllMocks();
    api.getProduct.mockReturnValue(of(product));
    api.getProductImages.mockReturnValue(of(page([image(1), image(2)])));
    api.getProductAttributes.mockReturnValue(of(page([{ id: 1, productId: 1, productName: 'Cricket bat', name: 'Weight', value: '1 kg' }])));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'customer/product/:id', component: StorefrontProductComponent }]),
        { provide: CatalogApiService, useValue: api },
      ],
    });
  });

  it('shows product details and switches gallery images', async () => {
    const harness = await RouterTestingHarness.create('/customer/product/1');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(api.getProduct).toHaveBeenCalledWith(1);
    expect(element.querySelector('h1')?.textContent).toContain('Cricket bat');
    expect(element.textContent).toContain('BAT-1');
    expect(element.textContent).toContain('Save 20%');
    expect(element.textContent).toContain('4.5');
    expect(element.textContent).toContain('2 reviews');
    expect(element.querySelector<HTMLButtonElement>('.buy-button')?.disabled).toBe(true);
    expect(element.querySelector<HTMLButtonElement>('.cart-button')?.disabled).toBe(true);
    expect(element.textContent).toContain('Online ordering is coming soon.');
    expect(element.textContent).toContain('Shipping estimates');
    expect(element.textContent).toContain('Made for cricket');
    expect(element.textContent).toContain('Weight');
    expect(element.textContent).toContain('1 kg');
    expect(element.querySelector<HTMLImageElement>('.main-image img')?.src).toBe('http://api.test/image-1.jpg');
    element.querySelectorAll<HTMLButtonElement>('.thumbnails button')[1].click();
    harness.detectChanges();
    expect(element.querySelector<HTMLImageElement>('.main-image img')?.src).toBe('http://api.test/image-2.jpg');
    expect(element.querySelectorAll('.thumbnails button')[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('shows no review rating or discount when neither is available', async () => {
    api.getProduct.mockReturnValue(of({ ...product, mrp: 800, reviewCount: 0, stock: 0 }));
    const harness = await RouterTestingHarness.create('/customer/product/1');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(element.textContent).toContain('0 reviews');
    expect(element.querySelector('.rating-value')).toBeNull();
    expect(element.querySelector('.price del')).toBeNull();
    expect(element.querySelector('.price span')).toBeNull();
    expect(element.querySelector('.stock')?.textContent).toContain('Out of stock');
  });

  it('loads all pages of images and specifications', async () => {
    api.getProductImages.mockImplementation((query: { pageNumber: number }) =>
      of(query.pageNumber === 1 ? page([image(1)], 1, 2, 1) : page([image(2)], 2, 2, 1)));
    api.getProductAttributes.mockImplementation((query: { pageNumber: number }) =>
      of(query.pageNumber === 1
        ? page([{ id: 1, name: 'Weight', value: '1 kg' }], 1, 2, 1)
        : page([{ id: 2, name: 'Size', value: 'Adult' }], 2, 2, 1)));
    const harness = await RouterTestingHarness.create('/customer/product/1');
    harness.detectChanges();
    expect(api.getProductImages).toHaveBeenCalledTimes(2);
    expect(api.getProductAttributes).toHaveBeenCalledTimes(2);
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Adult');
    expect((harness.routeNativeElement as HTMLElement).querySelectorAll('.thumbnails button')).toHaveLength(2);
  });

  it('handles invalid, missing, and inactive products', async () => {
    const harness = await RouterTestingHarness.create('/customer/product/invalid');
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Product not found');
    expect(api.getProduct).not.toHaveBeenCalled();
    api.getProduct.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 404 })));
    await harness.navigateByUrl('/customer/product/2');
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Product not found');
    api.getProduct.mockReturnValueOnce(of({ ...product, isActive: false }));
    await harness.navigateByUrl('/customer/product/3');
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Product not found');
    expect(api.getProductImages).not.toHaveBeenCalled();
  });

  it('displays errors and supports retrying product and gallery requests', async () => {
    api.getProduct.mockReturnValueOnce(throwError(() => new Error('Product API unavailable')));
    const harness = await RouterTestingHarness.create('/customer/product/1');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(element.querySelector('[role=alert]')?.textContent).toContain('Product API unavailable');
    api.getProductImages.mockReturnValueOnce(throwError(() => new Error('Images unavailable')));
    element.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    harness.detectChanges();
    expect(element.querySelector('h1')?.textContent).toContain('Cricket bat');
    expect(element.querySelector('[role=alert]')?.textContent).toContain('Images unavailable');
    element.querySelector<HTMLButtonElement>('[role=alert] button')!.click();
    harness.detectChanges();
    expect(element.querySelector('[role=alert]')).toBeNull();
    expect(element.querySelectorAll('.thumbnails button')).toHaveLength(2);
  });

  it('cancels the previous request when the product route changes', async () => {
    const pending = new Subject<Product>();
    api.getProduct.mockReturnValueOnce(pending.asObservable()).mockReturnValueOnce(of({ ...product, id: 2, name: 'Ball' }));
    const harness = await RouterTestingHarness.create('/customer/product/1');
    await harness.navigateByUrl('/customer/product/2');
    pending.next(product);
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('Ball');
  });
});
