import { CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription, catchError, forkJoin, map, of } from 'rxjs';
import { Brand, Category, Product } from '../../core/models/catalog.models';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { StorefrontCartService } from '../../core/services/storefront-cart.service';
import { getApiErrorMessage } from '../../core/utils/api-error';
import { StorefrontHeaderComponent } from './storefront-header.component';
import { StorefrontFooterComponent } from './storefront-footer.component';

@Component({
  selector: 'app-storefront-home',
  imports: [RouterLink, CurrencyPipe, StorefrontHeaderComponent, StorefrontFooterComponent],
  templateUrl: './storefront-home.component.html',
  styleUrl: './storefront-home.component.scss',
})
export class StorefrontHomeComponent implements OnInit, OnDestroy {
  private readonly api = inject(CatalogApiService);
  readonly cart = inject(StorefrontCartService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private catalogSubscription?: Subscription;
  private imageSubscription?: Subscription;

  searchTerm = '';
  products: Product[] = [];
  categories: Category[] = [];
  brands: Brand[] = [];
  images = new Map<number, string>();
  failedImages = new Set<number>();
  loading = true;
  imagesLoading = false;
  error = '';
  imageError = '';
  cartMessage = '';
  cartMessageProductId: number | null = null;

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void {
    this.catalogSubscription?.unsubscribe();
    this.imageSubscription?.unsubscribe();
  }

  load(): void {
    this.catalogSubscription?.unsubscribe();
    this.imageSubscription?.unsubscribe();
    this.loading = true;
    this.imagesLoading = false;
    this.error = '';
    this.imageError = '';
    this.images.clear();
    this.failedImages.clear();
    this.catalogSubscription = forkJoin({
      products: this.api.getProducts('', 1, 8, 'bestselling', true, undefined, true, true),
      categories: this.api.getCategories(),
      brands: this.api.getBrands(),
    }).subscribe({
      next: ({ products, categories, brands }) => {
        this.products = products.items.filter(product => product.isActive && product.hasImage && product.isPublished);
        this.categories = categories.filter(category => category.isActive && category.parentId === null)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id - b.id);
        this.brands = brands.filter(brand => brand.isActive).sort((a, b) => a.name.localeCompare(b.name));
        this.loading = false;
        this.loadImages();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.loading = false;
        this.error = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  search(): void {
    void this.router.navigate(['/cricket'], { queryParams: { search: this.searchTerm.trim() || null } });
  }

  addToCart(product: Product): void {
    const result = this.cart.add(product);
    this.cartMessageProductId = product.id;
    this.cartMessage = result === 'added'
      ? `${product.name} added to cart.`
      : result === 'out-of-stock'
        ? `${product.name} is out of stock.`
        : 'This quantity is unavailable.';
    this.changeDetector.markForCheck();
  }

  discount(product: Product): number {
    return product.mrp > product.salePrice && product.mrp > 0
      ? Math.round((product.mrp - product.salePrice) * 100 / product.mrp) : 0;
  }

  private loadImages(): void {
    if (!this.products.length) return;
    this.imagesLoading = true;
    this.imageSubscription = forkJoin(this.products.map(product =>
      this.api.getProductImages({
        pageNumber: 1, pageSize: 1, searchTerm: '', productId: product.id,
        sortBy: 'sortOrder', sortDirection: 'asc', isActive: true,
      }).pipe(
        map(page => ({ productId: product.id, image: page.items[0], error: false })),
        catchError(() => of({ productId: product.id, image: undefined, error: true })),
      ),
    )).subscribe(results => {
      for (const result of results) {
        if (result.image) this.images.set(result.productId, this.api.resolveAssetUrl(result.image.url));
      }
      if (results.some(result => result.error)) this.imageError = 'Some product images could not be loaded.';
      this.imagesLoading = false;
      this.changeDetector.markForCheck();
    });
  }
}
