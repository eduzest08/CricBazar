import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, Observable, Subscription, catchError, expand, forkJoin, from, map, mergeMap, of, reduce, throwError, toArray } from 'rxjs';
import { PaginatedResponse, Product, ProductAttribute, ProductImage } from '../../core/models/catalog.models';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { AddToCartResult, StorefrontCartService } from '../../core/services/storefront-cart.service';
import { getApiErrorMessage } from '../../core/utils/api-error';
import { StorefrontFooterComponent } from './storefront-footer.component';
import { StorefrontHeaderComponent } from './storefront-header.component';

@Component({
  selector: 'app-storefront-product',
  imports: [CurrencyPipe, DecimalPipe, FormsModule, RouterLink, StorefrontHeaderComponent, StorefrontFooterComponent],
  templateUrl: './storefront-product.component.html',
  styleUrl: './storefront-product.component.scss',
})
export class StorefrontProductComponent implements OnInit, OnDestroy {
  private readonly api = inject(CatalogApiService);
  readonly cart = inject(StorefrontCartService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private routeSubscription?: Subscription;
  private productSubscription?: Subscription;
  private detailsSubscription?: Subscription;
  private relatedSubscription?: Subscription;
  private relatedImagesSubscription?: Subscription;
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
  quantity = 1;
  cartMessage = '';
  relatedProducts: Product[] = [];
  relatedImages = new Map<number, string>();
  failedRelatedImages = new Set<number>();
  relatedLoading = false;
  relatedImagesLoading = false;
  relatedError = '';
  relatedImageError = '';
  relatedCartMessage = '';

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
    this.relatedSubscription?.unsubscribe();
    this.relatedImagesSubscription?.unsubscribe();
  }

  load(): void {
    this.productSubscription?.unsubscribe();
    this.detailsSubscription?.unsubscribe();
    this.relatedSubscription?.unsubscribe();
    this.relatedImagesSubscription?.unsubscribe();
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
    this.quantity = 1;
    this.cartMessage = '';
    this.relatedProducts = [];
    this.relatedImages.clear();
    this.failedRelatedImages.clear();
    this.relatedLoading = false;
    this.relatedImagesLoading = false;
    this.relatedError = '';
    this.relatedImageError = '';
    this.relatedCartMessage = '';
    if (!this.productId) return;

    this.productSubscription = this.api.getProduct(this.productId).subscribe({
      next: product => {
        this.loading = false;
        if (!product.isActive || !product.hasImage || !product.isPublished) {
          this.notFound = true;
        } else {
          this.product = product;
          this.loadDetails();
          this.loadRelatedProducts();
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

  loadRelatedProducts(): void {
    if (!this.product) return;
    this.relatedSubscription?.unsubscribe();
    this.relatedImagesSubscription?.unsubscribe();
    this.relatedProducts = [];
    this.relatedImages.clear();
    this.failedRelatedImages.clear();
    this.relatedImagesLoading = false;
    this.relatedImageError = '';
    this.relatedError = '';
    this.relatedLoading = true;
    const currentProduct = this.product;
    this.relatedSubscription = this.allPages(page =>
      this.api.getProducts('', page, 100, 'newest', true, currentProduct.categoryId, true, true),
    ).subscribe({
      next: products => {
        this.relatedProducts = products.filter(product =>
          product.isActive && product.hasImage && product.isPublished && product.id !== currentProduct.id && product.categoryId === currentProduct.categoryId);
        this.relatedLoading = false;
        this.loadRelatedImages();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.relatedLoading = false;
        this.relatedError = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  private loadRelatedImages(): void {
    if (!this.relatedProducts.length) return;
    this.relatedImagesLoading = true;
    this.relatedImagesSubscription = from(this.relatedProducts).pipe(
      mergeMap(product => this.api.getProductImages({
        pageNumber: 1, pageSize: 1, searchTerm: '', productId: product.id,
        sortBy: 'sortOrder', sortDirection: 'asc', isActive: true,
      }).pipe(
        map(page => ({ productId: product.id, image: page.items[0], error: false })),
        catchError(() => of({ productId: product.id, image: undefined, error: true })),
      ), 6),
      toArray(),
    ).subscribe(results => {
      for (const result of results) {
        if (result.image) this.relatedImages.set(result.productId, this.api.resolveAssetUrl(result.image.url));
      }
      if (results.some(result => result.error)) this.relatedImageError = 'Some related product images could not be loaded.';
      this.relatedImagesLoading = false;
      this.changeDetector.markForCheck();
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
    void this.router.navigate(['/cricket'], { queryParams: { search: this.searchTerm.trim() || null } });
  }

  addToCart(): void {
    if (!this.product) return;
    const result: AddToCartResult = this.cart.add(this.product, this.quantity);
    this.cartMessage = result === 'added'
      ? `${this.product.name} added to cart.`
      : result === 'out-of-stock'
        ? 'This product is out of stock.'
        : result === 'stock-limit'
          ? 'The requested quantity exceeds available stock.'
          : 'Enter a valid quantity.';
    this.changeDetector.markForCheck();
  }

  addRelatedToCart(product: Product): void {
    const result = this.cart.add(product);
    this.relatedCartMessage = result === 'added'
      ? `${product.name} added to cart.`
      : result === 'out-of-stock'
        ? `${product.name} is out of stock.`
        : `Cannot add ${product.name}: available stock has been reached.`;
    this.changeDetector.markForCheck();
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
