import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { ProductPayload } from '../models/catalog.models';
import { CatalogApiService } from './catalog-api.service';

describe('CatalogApiService product creation', () => {
  it('requests products filtered by category when provided', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(CatalogApiService);
    const http = TestBed.inject(HttpTestingController);
    api.getProducts('', 2, 100, 'newest', true, 7, true, true).subscribe();
    const request = http.expectOne(req => req.method === 'GET' && req.url.endsWith('/products'));
    expect(request.request.params.get('categoryId')).toBe('7');
    expect(request.request.params.get('hasImage')).toBe('true');
    expect(request.request.params.get('publishedOnly')).toBe('true');
    expect(request.request.params.get('pageNumber')).toBe('2');
    expect(request.request.params.has('status')).toBe(false);
    request.flush({ items: [], pageNumber: 2, pageSize: 100, totalCount: 0 });
    http.verify();
  });

  it('sends an optional product status without changing the existing filters', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const api = TestBed.inject(CatalogApiService);
    const http = TestBed.inject(HttpTestingController);
    api.getProducts('bat', 2, 10, 'id_desc', true, undefined, undefined, false, 'progress').subscribe();
    const request = http.expectOne(req => req.url.endsWith('/products'));
    expect(request.request.params.get('status')).toBe('progress');
    expect(request.request.params.get('searchTerm')).toBe('bat');
    expect(request.request.params.get('isActive')).toBe('true');
    request.flush({ items: [], pageNumber: 2, pageSize: 10, totalCount: 0, statusFilter: 'progress' });
    http.verify();
  });

  it('rejects a response from an older API that ignores the status filter', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const api = TestBed.inject(CatalogApiService);
    const http = TestBed.inject(HttpTestingController);
    let errorMessage = '';
    api.getProducts('', 1, 1, 'newest', true, undefined, undefined, false, 'progress').subscribe({
      error: (error: Error) => errorMessage = error.message,
    });
    http.expectOne(req => req.url.endsWith('/products')).flush({ items: [], pageNumber: 1, pageSize: 1, totalCount: 6 });
    expect(errorMessage).toContain('Restart or update the backend API');
    http.verify();
  });

  it('rejects a response for a different status', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const api = TestBed.inject(CatalogApiService);
    const http = TestBed.inject(HttpTestingController);
    let errorMessage = '';
    api.getProducts('', 1, 1, 'newest', true, undefined, undefined, false, 'progress').subscribe({
      error: (error: Error) => errorMessage = error.message,
    });
    http.expectOne(req => req.url.endsWith('/products')).flush({
      items: [], pageNumber: 1, pageSize: 1, totalCount: 6, statusFilter: 'active',
    });
    expect(errorMessage).toContain('requested status filter');
    http.verify();
  });

  it('sends the demo login ID only when creating a product', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const auth = TestBed.inject(AuthService);
    const api = TestBed.inject(CatalogApiService);
    const http = TestBed.inject(HttpTestingController);
    const payload: ProductPayload = {
      name: 'Bat', slug: 'bat', sku: '', categoryId: 1, brandId: 1, mrp: 100,
      salePrice: 80, costPrice: 40, stock: 5, shortDesc: '', description: '',
      metaTitle: '', metaDesc: '', isActive: true,
    };

    auth.login('admin', 'admin');
    api.createProduct(payload).subscribe();
    const create = http.expectOne((request) => request.method === 'POST' && request.url.endsWith('/products'));
    expect(create.request.body.createdByUserId).toBe('admin');
    create.flush({});

    api.updateProduct(1, payload).subscribe();
    const update = http.expectOne((request) => request.method === 'PUT' && request.url.endsWith('/products/1'));
    expect(update.request.body.createdByUserId).toBeUndefined();
    update.flush({});
    api.getProduct(1).subscribe();
    const get = http.expectOne((request) => request.method === 'GET' && request.url.endsWith('/products/1'));
    get.flush({});
    api.activateProduct(1).subscribe();
    const activate = http.expectOne((request) => request.method === 'POST' && request.url.endsWith('/products/1/activate'));
    activate.flush(null);
    api.deleteProductPermanently(1).subscribe();
    const permanent = http.expectOne((request) => request.method === 'DELETE' && request.url.endsWith('/products/1/permanent'));
    permanent.flush(null);
    http.verify();
    auth.logout();
  });
});
