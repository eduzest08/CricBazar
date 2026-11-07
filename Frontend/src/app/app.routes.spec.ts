import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { routes } from './app.routes';
import { CatalogApiService } from './core/services/catalog-api.service';

describe('application routes', () => {
  it('opens the storefront home at the site root', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        { provide: CatalogApiService, useValue: {
          getProducts: () => of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 8 }),
          getCategories: () => of([]),
          getBrands: () => of([]),
        } },
      ],
    });
    const harness = await RouterTestingHarness.create('/');
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Gear up for');
    await harness.navigateByUrl('/customer/home');
    expect(TestBed.inject(Router).url).toBe('/');
    expect(harness.routeNativeElement?.textContent).toContain('Gear up for');
  });
});
