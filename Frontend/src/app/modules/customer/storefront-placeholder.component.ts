import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, Subscription, catchError, combineLatest, expand, forkJoin, map, of, reduce, throwError } from 'rxjs';
import { Brand, Category, Product, ProductImage } from '../../core/models/catalog.models';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { StorefrontCartService } from '../../core/services/storefront-cart.service';
import { getApiErrorMessage } from '../../core/utils/api-error';
import { StorefrontHeaderComponent } from './storefront-header.component';
import { StorefrontFooterComponent } from './storefront-footer.component';

type CatalogSort = 'newest' | 'name_asc' | 'price_asc' | 'price_desc' | 'rating';
interface CategoryOption { category: Category; count: number; }
interface SubcategoryOption extends CategoryOption { rootId: number; depth: number; }

@Component({
  selector: 'app-storefront-placeholder',
  imports: [FormsModule, CurrencyPipe, DecimalPipe, RouterLink, StorefrontHeaderComponent, StorefrontFooterComponent],
  templateUrl: './storefront-placeholder.component.html',
  styleUrl: './storefront-placeholder.component.scss',
})
export class StorefrontPlaceholderComponent implements OnInit, OnDestroy {
  private readonly api = inject(CatalogApiService);
  readonly cart = inject(StorefrontCartService);
  private readonly route = inject(ActivatedRoute);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private routeSubscription?: Subscription;
  private catalogSubscription?: Subscription;
  private imagesSubscription?: Subscription;
  products: Product[] = [];
  categories: Category[] = [];
  categoryOptions: CategoryOption[] = [];
  private allSubcategoryOptions: SubcategoryOption[] = [];
  private categoryParents = new Map<number, number | null>();
  brands: Brand[] = [];
  availableBrands: Brand[] = [];
  images = new Map<number, string>();
  failedImages = new Set<number>();
  loading = true;
  imageLoading = false;
  error = '';
  imageError = '';
  cartMessage = '';
  cartMessageProductId: number | null = null;
  searchInput = '';
  searchTerm = '';
  selectedCategoryIds = new Set<number>();
  selectedSubcategoryIds = new Set<number>();
  selectedBrandIds = new Set<number>();
  categoryPageId: number | null = null;
  isCategoryPage = false;
  brandId: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy: CatalogSort = 'newest';
  page = 1;
  pageSize = 20;
  filterOpen = false;
  view: 'grid' | 'list' = 'grid';

  ngOnInit(): void {
    this.routeSubscription = combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([routeParams, params]) => {
      this.isCategoryPage = routeParams.has('id');
      const category = Number(this.isCategoryPage ? routeParams.get('id') : params.get('category'));
      this.categoryPageId = this.isCategoryPage && Number.isSafeInteger(category) && category > 0 ? category : null;
      const brand = Number(params.get('brand'));
      this.selectedCategoryIds.clear();
      this.selectedSubcategoryIds.clear();
      if (Number.isSafeInteger(category) && category > 0) this.selectedCategoryIds.add(category);
      this.normalizeCategorySelection();
      this.brandId = Number.isSafeInteger(brand) && brand > 0 ? brand : null;
      this.selectedBrandIds.clear();
      if (this.brandId !== null) this.selectedBrandIds.add(this.brandId);
      this.updateAvailableBrands();
      this.searchInput = params.get('search')?.trim() ?? '';
      this.searchTerm = this.searchInput;
      this.page = 1;
      if (!this.loading) this.loadImages();
      this.changeDetector.markForCheck();
    });
    this.loadCatalog();
  }

  ngOnDestroy(): void {
    this.catalogSubscription?.unsubscribe();
    this.imagesSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  loadCatalog(): void {
    this.catalogSubscription?.unsubscribe();
    this.imagesSubscription?.unsubscribe();
    this.loading = true;
    this.error = '';
    this.imageError = '';
    const fetchPage = (page: number) => this.api.getProducts('', page, 100, 'newest', true, undefined, true, true);
    const products = fetchPage(1).pipe(
      expand(result => {
        if (result.pageNumber * result.pageSize >= result.totalCount) return EMPTY;
        if (!result.items.length || result.pageSize <= 0) {
          return throwError(() => new Error('The product catalog changed while loading. Please try again.'));
        }
        return fetchPage(result.pageNumber + 1);
      }),
      reduce((items, result) => [...items, ...result.items], [] as Product[]),
    );
    this.catalogSubscription = forkJoin({
      products,
      categories: this.api.getCategories(),
      brands: this.api.getBrands(),
    }).subscribe({
      next: ({ products, categories, brands }) => {
        this.products = products.filter(product => product.isActive && product.hasImage && product.isPublished);
        const flattened = new Map<number, Category>();
        const visit = (items: Category[]) => items.forEach(item => {
          if (flattened.has(item.id)) return;
          flattened.set(item.id, item);
          visit(item.children ?? []);
        });
        visit(categories);
        this.categories = [...flattened.values()].filter(category => category.isActive);
        this.categoryParents = new Map(this.categories.map(category => [category.id, category.parentId]));
        this.categoryOptions = this.categories
          .filter(category => category.parentId === null)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id - b.id)
          .map(category => ({
            category,
            count: this.products.filter(product => this.isInCategory(product.categoryId, category.id)).length,
          }));
        const sortedCategories = [...this.categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id - b.id);
        this.allSubcategoryOptions = [];
        const visited = new Set<number>();
        const visitChildren = (parentId: number, rootId: number, depth: number): void => {
          for (const category of sortedCategories.filter(item => item.parentId === parentId)) {
            if (visited.has(category.id)) continue;
            visited.add(category.id);
            this.allSubcategoryOptions.push({
              category, rootId, depth,
              count: this.products.filter(product => this.isInCategory(product.categoryId, category.id)).length,
            });
            visitChildren(category.id, rootId, depth + 1);
          }
        };
        this.categoryOptions.forEach(option => visitChildren(option.category.id, option.category.id, 0));
        this.normalizeCategorySelection();
        this.brands = brands.filter(brand => brand.isActive).sort((a, b) => a.name.localeCompare(b.name));
        this.updateAvailableBrands();
        this.loading = false;
        this.page = Math.min(this.page, this.pageCount);
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

  private matchesCategory(product: Product): boolean {
    if (this.isCategoryPage && (!this.categoryPageId || !this.categoryPage ||
      !this.isInCategory(product.categoryId, this.categoryPageId))) return false;
    if (!this.selectedCategoryIds.size) return true;
    return [...this.selectedCategoryIds].some(id => {
      if (!this.isInCategory(product.categoryId, id)) return false;
      const selectedChildren = [...this.selectedSubcategoryIds].filter(child => this.isInCategory(child, id));
      return !selectedChildren.length || selectedChildren.some(child => this.isInCategory(product.categoryId, child));
    });
  }

  private isInCategory(categoryId: number, ancestorId: number): boolean {
    let id: number | null = categoryId;
    const seen = new Set<number>();
    while (id !== null && !seen.has(id)) {
      if (id === ancestorId) return true;
      seen.add(id);
      id = this.categoryParents.get(id) ?? null;
    }
    return false;
  }

  private updateAvailableBrands(): void {
    const categoryId = this.categoryPageId;
    if (categoryId === null || !this.categoryPage) {
      this.availableBrands = [];
      return;
    }
    const productBrandIds = new Set(this.products
      .filter(product => this.isInCategory(product.categoryId, categoryId))
      .map(product => product.brandId));
    this.availableBrands = this.brands.filter(brand => productBrandIds.has(brand.id));
  }

  get hasUnavailableBrandSelection(): boolean {
    return [...this.selectedBrandIds].some(id => !this.availableBrands.some(brand => brand.id === id));
  }

  get subcategoryOptions(): SubcategoryOption[] {
    return this.allSubcategoryOptions.filter(option => this.selectedCategoryIds.has(option.rootId) &&
      (!this.isCategoryPage || (this.categoryPageId !== null && option.category.id !== this.categoryPageId &&
        this.isInCategory(option.category.id, this.categoryPageId))));
  }

  get categoryPage(): Category | undefined {
    return this.categories.find(category => category.id === this.categoryPageId);
  }

  get selectedBrandName(): string {
    return this.brands.find(brand => brand.id === this.brandId)?.name ?? `Brand ${this.brandId}`;
  }

  private normalizeCategorySelection(): void {
    for (const selected of [...this.selectedCategoryIds]) {
      let id = selected;
      const seen = new Set<number>();
      while (this.categoryParents.has(id) && this.categoryParents.get(id) !== null && !seen.has(id)) {
        seen.add(id);
        const parent = this.categoryParents.get(id);
        if (parent == null || !this.categoryParents.has(parent)) break;
        id = parent;
      }
      if (id !== selected && this.categoryParents.get(id) === null) {
        this.selectedCategoryIds.delete(selected);
        this.selectedCategoryIds.add(id);
        if (!this.isCategoryPage) this.selectedSubcategoryIds.add(selected);
      }
    }
  }

  get filteredProducts(): Product[] {
    const term = this.searchTerm.toLocaleLowerCase();
    return this.products.filter(product =>
      (!term || [product.name, product.sku, product.shortDesc ?? '', product.description ?? '']
        .some(value => value.toLocaleLowerCase().includes(term))) &&
      this.matchesCategory(product) &&
      (this.isCategoryPage
        ? !this.selectedBrandIds.size || this.selectedBrandIds.has(product.brandId)
        : this.brandId === null || product.brandId === this.brandId) &&
      (this.minPrice === null || product.salePrice >= this.minPrice) &&
      (this.maxPrice === null || product.salePrice <= this.maxPrice)
    ).sort((a, b) => {
      switch (this.sortBy) {
        case 'name_asc': return a.name.localeCompare(b.name) || a.id - b.id;
        case 'price_asc': return a.salePrice - b.salePrice || a.id - b.id;
        case 'price_desc': return b.salePrice - a.salePrice || a.id - b.id;
        case 'rating': return b.avgRating - a.avgRating || a.id - b.id;
        default: return b.createdAt.localeCompare(a.createdAt) || b.id - a.id;
      }
    });
  }

  get pageCount(): number { return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize)); }
  get visibleProducts(): Product[] { return this.filteredProducts.slice((this.page - 1) * this.pageSize, this.page * this.pageSize); }
  get firstItem(): number { return this.filteredProducts.length ? (this.page - 1) * this.pageSize + 1 : 0; }
  get lastItem(): number { return Math.min(this.page * this.pageSize, this.filteredProducts.length); }
  get priceInvalid(): boolean {
    return (this.minPrice !== null && this.minPrice < 0) || (this.maxPrice !== null && this.maxPrice < 0) ||
      (this.minPrice !== null && this.maxPrice !== null && this.minPrice > this.maxPrice);
  }

  search(): void { this.searchTerm = this.searchInput.trim(); this.filterChanged(); }
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
  filterChanged(): void { this.page = 1; this.loadImages(); }
  setCategorySelected(id: number, selected: boolean): void {
    for (const selectedId of this.selectedCategoryIds) {
      if (this.isInCategory(selectedId, id)) this.selectedCategoryIds.delete(selectedId);
    }
    for (const selectedId of this.selectedSubcategoryIds) {
      if (this.isInCategory(selectedId, id)) this.selectedSubcategoryIds.delete(selectedId);
    }
    if (selected) this.selectedCategoryIds.add(id);
    this.filterChanged();
  }
  setSubcategorySelected(id: number, selected: boolean): void {
    if (selected) this.selectedSubcategoryIds.add(id);
    else this.selectedSubcategoryIds.delete(id);
    this.filterChanged();
  }
  setBrandSelected(id: number, selected: boolean): void {
    if (selected) this.selectedBrandIds.add(id);
    else this.selectedBrandIds.delete(id);
    this.filterChanged();
  }
  clearCategories(): void {
    this.selectedCategoryIds.clear();
    this.selectedSubcategoryIds.clear();
    this.filterChanged();
  }
  clearFilters(): void {
    this.searchInput = '';
    this.searchTerm = '';
    this.selectedCategoryIds.clear();
    if (this.isCategoryPage && this.categoryPageId !== null) {
      this.selectedCategoryIds.add(this.categoryPageId);
      this.normalizeCategorySelection();
    }
    this.selectedSubcategoryIds.clear();
    this.brandId = null;
    this.selectedBrandIds.clear();
    this.minPrice = null;
    this.maxPrice = null;
    this.filterChanged();
  }
  changePage(page: number): void {
    this.page = Math.max(1, Math.min(page, this.pageCount));
    this.loadImages();
  }
  discount(product: Product): number {
    return product.mrp > product.salePrice && product.mrp > 0
      ? Math.round((product.mrp - product.salePrice) * 100 / product.mrp) : 0;
  }
  imageFailed(id: number): void { this.failedImages.add(id); }

  private loadImages(): void {
    this.imagesSubscription?.unsubscribe();
    this.images = new Map();
    this.failedImages.clear();
    this.imageError = '';
    const products = this.visibleProducts;
    if (!products.length) { this.imageLoading = false; return; }
    this.imageLoading = true;
    this.imagesSubscription = forkJoin(products.map(product =>
      this.api.getProductImages({
        pageNumber: 1, pageSize: 1, searchTerm: '', productId: product.id,
        sortBy: 'sortOrder', sortDirection: 'asc', isActive: true,
      }).pipe(
        map(page => ({ productId: product.id, image: page.items[0] as ProductImage | undefined, error: false })),
        catchError(() => of({ productId: product.id, image: undefined, error: true })),
      ),
    )).subscribe(results => {
      for (const result of results) {
        if (result.image) this.images.set(result.productId, this.api.resolveAssetUrl(result.image.url));
      }
      if (results.some(result => result.error)) this.imageError = 'Some product images could not be loaded. Refresh to try again.';
      this.imageLoading = false;
      this.changeDetector.markForCheck();
    });
  }
}
