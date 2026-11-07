import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { ProductPayload } from '../models/catalog.models';
import { CatalogApiService } from './catalog-api.service';

describe('CatalogApiService product creation', () => {
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
    api.deleteProductPermanently(1).subscribe();
    const permanent = http.expectOne((request) => request.method === 'DELETE' && request.url.endsWith('/products/1/permanent'));
    permanent.flush(null);
    http.verify();
    auth.logout();
  });
});
