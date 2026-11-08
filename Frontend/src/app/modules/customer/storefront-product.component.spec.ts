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
    sortOrder: 0, metaTitle: null, metaDesc: null, isActive: true, hasImage: true, isPublished: true, createdAt: '', updatedAt: '', createdBy: null,
  };
  const api = {
    getProduct: vi.fn(),
    getProducts: vi.fn(),
    getCategories: () => of([]),
    getProductImages: vi.fn(),
    getProductAttributes: vi.fn(),
    resolveAssetUrl: (url: string) => `http://api.test${url}`,
  };
  const page = <T>(items: T[], pageNumber = 1, totalCount = items.length, pageSize = 100) =>
    ({ items, pageNumber, totalCount, pageSize });
  const image = (id: number) => ({ id, productId: 1, productName: 'Cricket bat', productIsPublished: true, url: `/image-${id}.jpg`, sortOrder: id });

  beforeEach(() => {
    vi.resetAllMocks();
    api.getProduct.mockReturnValue(of(product));
    api.getProducts.mockReturnValue(of({ items: [], pageNumber: 1, totalCount: 0, pageSize: 100 }));
    api.getProductImages.mockReturnValue(of(page([image(1), image(2)])));
    api.getProductAttributes.mockReturnValue(of(page([{ id: 1, productId: 1, productName: 'Cricket bat', name: 'Weight', value: '1 kg' }])));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'cricket/product/:id', component: StorefrontProductComponent }]),
        { provide: CatalogApiService, useValue: api },
      ],
    });
  });

  it('shows all active related products from the same category across pages', async () => {
    const related = { ...product, id: 2, name: 'Related bat' };
    const other = { ...product, id: 3, name: 'Other category', categoryId: 2 };
    const inactive = { ...product, id: 4, name: 'Inactive bat', isActive: false };
    const secondRelated = { ...product, id: 5, name: 'Second bat', stock: 0 };
    api.getProducts.mockImplementation((_search: string, pageNumber: number) => of(
      pageNumber === 1 ? page([product, related, other], 1, 5, 3) : page([inactive, secondRelated], 2, 5, 3),
    ));
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(api.getProducts).toHaveBeenCalledWith('', 1, 100, 'newest', true, 1, true, true);
    expect(api.getProducts).toHaveBeenCalledWith('', 2, 100, 'newest', true, 1, true, true);
    const cards = element.querySelectorAll<HTMLElement>('.related-card');
    expect(cards).toHaveLength(2);
    expect(cards[0].textContent).toContain('Related bat');
    expect(cards[0].querySelector('a')?.getAttribute('href')).toBe('/cricket/product/2');
    expect(cards[1].textContent).toContain('Second bat');
    expect(cards[1].querySelector<HTMLButtonElement>('.related-cart-button')?.disabled).toBe(true);
    cards[0].querySelector<HTMLButtonElement>('.related-cart-button')!.click();
    harness.detectChanges();
    expect(element.querySelector('.related-cart-status')?.textContent).toContain('Related bat added to cart');
    expect(element.querySelector('.cart-toggle')?.textContent).toContain('Your Cart (1)');
  });

  it('shows related product loading errors and retries without hiding product details', async () => {
    api.getProducts.mockReturnValueOnce(throwError(() => new Error('Catalog unavailable')))
      .mockReturnValueOnce(of(page([{ ...product, id: 2, name: 'Related bat' }])));
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Cricket bat');
    expect(element.querySelector('.related-products [role=alert]')?.textContent).toContain('Catalog unavailable');
    element.querySelector<HTMLButtonElement>('.related-products [role=alert] button')!.click();
    harness.detectChanges();
    expect(element.querySelector('.related-card')?.textContent).toContain('Related bat');
  });

  it('shows related image failures without hiding related products', async () => {
    api.getProducts.mockReturnValue(of(page([{ ...product, id: 2, name: 'Related bat' }])));
    api.getProductImages.mockImplementation((query: { productId: number }) =>
      query.productId === 2 ? throwError(() => new Error('Image unavailable')) : of(page([image(1)])));
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(element.querySelector('.related-card')?.textContent).toContain('Related bat');
    expect(element.querySelector('.related-products [role=alert]')?.textContent).toContain('Some related product images could not be loaded');
  });

  it('cancels the previous related products request when the product route changes', async () => {
    const pending = new Subject<ReturnType<typeof page<Product>>>();
    api.getProduct.mockReturnValueOnce(of(product)).mockReturnValueOnce(of({ ...product, id: 2, categoryId: 2 }));
    api.getProducts.mockReturnValueOnce(pending.asObservable()).mockReturnValueOnce(of(page([
      { ...product, id: 3, name: 'New related item', categoryId: 2 },
    ])));
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    await harness.navigateByUrl('/cricket/product/2');
    pending.next(page([{ ...product, id: 4, name: 'Old related item' }]));
    pending.complete();
    harness.detectChanges();
    const related = (harness.routeNativeElement as HTMLElement).querySelector('.related-products');
    expect(related?.textContent).toContain('New related item');
    expect(related?.textContent).not.toContain('Old related item');
  });

  it('shows product details and switches gallery images', async () => {
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(api.getProduct).toHaveBeenCalledWith(1);
    expect(element.querySelector('h1')?.textContent).toContain('Cricket bat');
    expect(element.textContent).toContain('BAT-1');
    expect(element.textContent).toContain('Save 20%');
    expect(element.textContent).toContain('4.5');
    expect(element.textContent).toContain('2 reviews');
    expect(element.querySelector<HTMLButtonElement>('.buy-button')?.disabled).toBe(true);
    expect(element.querySelector<HTMLButtonElement>('.cart-button')?.disabled).toBe(false);
    expect(element.textContent).toContain('Checkout and shipping are not available yet.');
    expect(element.textContent).toContain('Shipping estimates');
    expect(element.textContent).toContain('Made for cricket');
    expect(element.textContent).toContain('Weight');
    expect(element.textContent).toContain('1 kg');
    expect(element.querySelector('.product-layout')?.nextElementSibling).toBe(element.querySelector('.product-main > .details'));
    expect(element.querySelector('.product-info .details')).toBeNull();
    expect(element.querySelector<HTMLImageElement>('.main-image img')?.src).toBe('http://api.test/image-1.jpg');
    element.querySelectorAll<HTMLButtonElement>('.thumbnails button')[1].click();
    harness.detectChanges();
    expect(element.querySelector<HTMLImageElement>('.main-image img')?.src).toBe('http://api.test/image-2.jpg');
    expect(element.querySelectorAll('.thumbnails button')[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('renders formatted product descriptions and sanitizes unsafe HTML', async () => {
    api.getProduct.mockReturnValue(of({
      ...product,
      description: '<p>Features</p><ul><li><strong>Lightweight</strong></li><li>Durable</li></ul><img src="x" onerror="alert(1)"><script>alert(1)</script>',
    }));
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    harness.detectChanges();
    const description = (harness.routeNativeElement as HTMLElement).querySelector('.description')!;
    expect(description.querySelector('p')?.textContent).toBe('Features');
    expect(description.querySelectorAll('ul li')).toHaveLength(2);
    expect(description.querySelector('li strong')?.textContent).toBe('Lightweight');
    expect(description.textContent).not.toContain('<ul>');
    expect(description.querySelector('script')).toBeNull();
    expect(description.querySelector('img')?.hasAttribute('onerror')).toBe(false);
  });

  it('does not show an enabled product without an image when opened directly', async () => {
    api.getProduct.mockReturnValue(of({ ...product, hasImage: false }));
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(element.textContent).toContain('Product not found');
    expect(element.querySelector('.product-layout')).toBeNull();
    expect(api.getProducts).not.toHaveBeenCalled();
  });

  it('does not show an unpublished product with an image', async () => {
    api.getProduct.mockReturnValue(of({ ...product, isPublished: false }));
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Product not found');
  });

  it('adds an in-stock product to the cart and prevents exceeding available stock', async () => {
    api.getProduct.mockReturnValue(of({ ...product, stock: 2 }));
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    harness.detectChanges();
    const component = harness.routeDebugElement!.componentInstance as StorefrontProductComponent;
    const element = harness.routeNativeElement as HTMLElement;
    component.quantity = 2;
    element.querySelector<HTMLButtonElement>('.cart-button')!.click();
    harness.detectChanges();
    expect(element.querySelector('[role=status]')?.textContent).toContain('added to cart');

    component.quantity = 1;
    element.querySelector<HTMLButtonElement>('.cart-button')!.click();
    harness.detectChanges();
    expect(element.querySelector('[role=status]')?.textContent).toContain('exceeds available stock');

    element.querySelector<HTMLButtonElement>('.cart-toggle')!.click();
    harness.detectChanges();
    expect(element.querySelector('.cart-toggle')?.textContent).toContain('Your Cart (2)');
    expect(element.querySelector('.cart-items')?.textContent).toContain('Cricket bat');
    expect(element.querySelector('.cart-subtotal')?.textContent).toContain('₹1,600');
  });

  it('shows no review rating or discount when neither is available', async () => {
    api.getProduct.mockReturnValue(of({ ...product, mrp: 800, reviewCount: 0, stock: 0 }));
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    harness.detectChanges();
    const element = harness.routeNativeElement as HTMLElement;
    expect(element.textContent).toContain('0 reviews');
    expect(element.querySelector('.rating-value')).toBeNull();
    expect(element.querySelector('.price del')).toBeNull();
    expect(element.querySelector('.price span')).toBeNull();
    expect(element.querySelector('.stock')?.textContent).toContain('Out of stock');
    expect(element.querySelector<HTMLButtonElement>('.cart-button')?.disabled).toBe(true);
  });

  it('loads all pages of images and specifications', async () => {
    api.getProductImages.mockImplementation((query: { pageNumber: number }) =>
      of(query.pageNumber === 1 ? page([image(1)], 1, 2, 1) : page([image(2)], 2, 2, 1)));
    api.getProductAttributes.mockImplementation((query: { pageNumber: number }) =>
      of(query.pageNumber === 1
        ? page([{ id: 1, name: 'Weight', value: '1 kg' }], 1, 2, 1)
        : page([{ id: 2, name: 'Size', value: 'Adult' }], 2, 2, 1)));
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    harness.detectChanges();
    expect(api.getProductImages).toHaveBeenCalledTimes(2);
    expect(api.getProductAttributes).toHaveBeenCalledTimes(2);
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Adult');
    expect((harness.routeNativeElement as HTMLElement).querySelectorAll('.thumbnails button')).toHaveLength(2);
  });

  it('handles invalid, missing, and inactive products', async () => {
    const harness = await RouterTestingHarness.create('/cricket/product/invalid');
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Product not found');
    expect(api.getProduct).not.toHaveBeenCalled();
    api.getProduct.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 404 })));
    await harness.navigateByUrl('/cricket/product/2');
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Product not found');
    api.getProduct.mockReturnValueOnce(of({ ...product, isActive: false }));
    await harness.navigateByUrl('/cricket/product/3');
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Product not found');
    expect(api.getProductImages).not.toHaveBeenCalled();
  });

  it('displays errors and supports retrying product and gallery requests', async () => {
    api.getProduct.mockReturnValueOnce(throwError(() => new Error('Product API unavailable')));
    const harness = await RouterTestingHarness.create('/cricket/product/1');
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
    const harness = await RouterTestingHarness.create('/cricket/product/1');
    await harness.navigateByUrl('/cricket/product/2');
    pending.next(product);
    harness.detectChanges();
    expect((harness.routeNativeElement as HTMLElement).querySelector('h1')?.textContent).toContain('Ball');
  });
});
