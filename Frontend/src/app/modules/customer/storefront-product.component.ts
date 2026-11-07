import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, Observable, Subscription, expand, forkJoin, reduce, throwError } from 'rxjs';
import { PaginatedResponse, Product, ProductAttribute, ProductImage } from '../../core/models/catalog.models';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { getApiErrorMessage } from '../../core/utils/api-error';
import { StorefrontFooterComponent } from './storefront-footer.component';
import { StorefrontHeaderComponent } from './storefront-header.component';

@Component({
  selector: 'app-storefront-product',
  imports: [CurrencyPipe, DecimalPipe, RouterLink, StorefrontHeaderComponent, StorefrontFooterComponent],
  templateUrl: './storefront-product.component.html',
  styleUrl: './storefront-product.component.scss',
})
export class StorefrontProductComponent implements OnInit, OnDestroy {
  private readonly api = inject(CatalogApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private routeSubscription?: Subscription;
  private productSubscription?: Subscription;
  private detailsSubscription?: Subscription;
  private productId = 0;

  product: Product | null = null;
  images: ProductImage[] = [];
  attributes: ProductAttribute[] = [];
  selectedImageId: number | null = null;
  failedImages = new Set<number>();
  searchTerm = '';
  loading = true;
  detailsLoading = false;
  error = '';
  detailsError = '';
  notFound = false;

  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.productId = Number.isSafeInteger(id) && id > 0 ? id : 0;
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
    this.productSubscription?.unsubscribe();
    this.detailsSubscription?.unsubscribe();
  }

  load(): void {
    this.productSubscription?.unsubscribe();
    this.detailsSubscription?.unsubscribe();
    this.product = null;
    this.images = [];
    this.attributes = [];
    this.selectedImageId = null;
    this.failedImages.clear();
    this.detailsLoading = false;
    this.detailsError = '';
    this.error = '';
    this.notFound = !this.productId;
    this.loading = !!this.productId;
    if (!this.productId) return;

    this.productSubscription = this.api.getProduct(this.productId).subscribe({
      next: product => {
        this.loading = false;
        if (!product.isActive) {
          this.notFound = true;
        } else {
          this.product = product;
          this.loadDetails();
        }
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.loading = false;
        if (error instanceof HttpErrorResponse && error.status === 404) this.notFound = true;
        else this.error = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  loadDetails(): void {
    if (!this.product) return;
    this.detailsSubscription?.unsubscribe();
    const productId = this.product.id;
    this.detailsLoading = true;
    this.detailsError = '';
    const images = (pageNumber: number) => this.api.getProductImages({
      pageNumber, pageSize: 100, searchTerm: '', productId, sortBy: 'sortOrder', sortDirection: 'asc', isActive: true,
    });
    const attributes = (pageNumber: number) => this.api.getProductAttributes({
      pageNumber, pageSize: 100, searchTerm: '', productId, sortBy: 'name', sortDirection: 'asc', isActive: true,
    });
    this.detailsSubscription = forkJoin({
      images: this.allPages(images),
      attributes: this.allPages(attributes),
    }).subscribe({
      next: result => {
        this.images = result.images;
        this.attributes = result.attributes;
        this.selectedImageId = this.images[0]?.id ?? null;
        this.failedImages.clear();
        this.detailsLoading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.detailsLoading = false;
        this.detailsError = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  get selectedImage(): ProductImage | undefined {
    return this.images.find(image => image.id === this.selectedImageId);
  }

  get discount(): number {
    const product = this.product;
    return product && product.mrp > product.salePrice && product.mrp > 0
      ? Math.round((product.mrp - product.salePrice) * 100 / product.mrp) : 0;
  }

  imageUrl(image: ProductImage): string {
    return this.api.resolveAssetUrl(image.url);
  }

  search(): void {
    void this.router.navigate(['/customer'], { queryParams: { search: this.searchTerm.trim() || null } });
  }

  private allPages<T>(fetchPage: (page: number) => Observable<PaginatedResponse<T>>): Observable<T[]> {
    return fetchPage(1).pipe(
      expand(result => {
        if (result.pageNumber * result.pageSize >= result.totalCount) return EMPTY;
        if (!result.items.length || result.pageSize <= 0) {
          return throwError(() => new Error('Product details changed while loading. Please try again.'));
        }
        return fetchPage(result.pageNumber + 1);
      }),
      reduce((items, result) => [...items, ...result.items], [] as T[]),
    );
  }
}
