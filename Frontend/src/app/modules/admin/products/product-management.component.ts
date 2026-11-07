import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subscription, expand, reduce } from 'rxjs';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { RichTextEditorComponent } from '../../../shared/rich-text-editor.component';
import { ActionIconComponent } from '../shared/action-icon.component';
import {
  Brand,
  Category,
  Product,
  ProductDraft,
  ProductImage,
  ProductPayload,
  ProductSortField,
} from '../../../core/models/catalog.models';

function emptyProductDraft(): ProductDraft {
  return {
    name: '',
    slug: '',
    sku: '',
    categoryId: null,
    brandId: null,
    mrp: 0,
    salePrice: 0,
    costPrice: 0,
    shortDesc: '',
    description: '',
    stock: 0,
    metaTitle: '',
    metaDesc: '',
    isActive: true,
  };
}

function validPrice(price: number | null): price is number {
  return typeof price === 'number' && Number.isFinite(price) && price >= 0;
}

function priceRatio(salePrice: number, costPrice: number, denominator: number): number | null {
  if (!validPrice(salePrice) || !validPrice(costPrice) || !validPrice(denominator) || denominator === 0) {
    return null;
  }
  return (salePrice - costPrice) / denominator;
}

interface CategoryOption {
  category: Category;
  path: string;
  treeLabel: string;
  isParent: boolean;
}

@Component({
  selector: 'app-product-management',
  imports: [CurrencyPipe, DatePipe, PercentPipe, FormsModule, RichTextEditorComponent, ActionIconComponent],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.scss',
})
export class ProductManagementComponent implements OnInit, OnDestroy {
  private readonly api = inject(CatalogApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private viewerSubscription?: Subscription;

  products: Product[] = [];
  categories: Category[] = [];
  categoryOptions: CategoryOption[] = [];
  brands: Brand[] = [];
  draft = emptyProductDraft();
  editingId: number | null = null;
  searchTerm = '';
  pageNumber = 1;
  readonly pageSizeOptions = [5, 10, 25, 50];
  pageSize = 10;
  sortBy: ProductSortField = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';
  totalCount = 0;
  activeTab: 'active' | 'inactive' = 'active';
  loading = false;
  saving = false;
  exporting: 'excel' | 'pdf' | null = null;
  errorMessage = '';
  successMessage = '';
  marginPercentage: number | null = 0;
  discountPercentage: number | null = null;
  calculationError = 'Enter a cost price above zero to calculate the sale price from margin.';
  private pricingMode: 'margin' | 'discount' | null = 'margin';
  private pricingRate: number | null = 0;

  async exportProducts(format: 'excel' | 'pdf'): Promise<void> {
    if (this.exporting) return;
    this.exporting = format;
    this.errorMessage = '';
    this.successMessage = '';
    try {
      const { loadProductReport, createProductWorkbook, createProductPdf, downloadReport } = await import('./product-export');
      const report = await loadProductReport(this.api);
      const blob = format === 'excel' ? await createProductWorkbook(report) : await createProductPdf(report);
      downloadReport(blob, `cricbazar-products.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      this.successMessage = `Export prepared for ${report.products.length} products.`;
    } catch (error: unknown) {
      this.errorMessage = `Export failed: ${getApiErrorMessage(error)}`;
    } finally {
      this.exporting = null;
      this.changeDetector.markForCheck();
    }
  }

  get profitMargin(): number | null {
    const { salePrice, costPrice } = this.draft;
    return priceRatio(salePrice, costPrice, salePrice);
  }

  get markup(): number | null {
    const { salePrice, costPrice } = this.draft;
    return priceRatio(salePrice, costPrice, costPrice);
  }

  get isSellingAtLoss(): boolean {
    const { salePrice, costPrice } = this.draft;
    return validPrice(salePrice) && validPrice(costPrice) && salePrice < costPrice;
  }

  changePercentage(mode: 'margin' | 'discount', value: number | null): void {
    if (mode === 'margin') {
      this.marginPercentage = value;
    } else {
      this.discountPercentage = value;
    }

    if (value === null) {
      this.pricingMode = null;
      this.pricingRate = null;
      this.calculationError = 'Enter a margin or discount to calculate the sale price.';
      return;
    }

    this.pricingMode = mode;
    this.pricingRate = value;
    this.calculateSalePrice();
  }

  changePrice(field: 'mrp' | 'costPrice'): void {
    if (this.pricingMode === null) {
      this.calculationError = 'Enter a margin or discount to calculate the sale price.';
    } else if (this.pricingMode === 'margin' && field === 'costPrice' ||
               this.pricingMode === 'discount' && field === 'mrp') {
      this.calculateSalePrice();
    } else {
      this.syncPercentages();
    }
  }

  private calculateSalePrice(): void {
    const value = this.pricingRate;
    if (value === null || !Number.isFinite(value)) {
      this.calculationError = 'Enter a valid percentage.';
      return;
    }

    let salePrice: number;
    if (this.pricingMode === 'margin') {
      if (value >= 100) {
        this.calculationError = 'Margin must be less than 100%.';
        return;
      }
      if (!validPrice(this.draft.costPrice) || this.draft.costPrice === 0) {
        this.calculationError = 'Enter a cost price above zero to calculate the sale price from margin.';
        return;
      }
      salePrice = this.draft.costPrice / (1 - value / 100);
    } else {
      if (value < 0 || value > 100) {
        this.calculationError = 'Discount must be between 0% and 100%.';
        return;
      }
      if (!validPrice(this.draft.mrp) || this.draft.mrp === 0) {
        this.calculationError = 'Enter an MRP above zero to calculate the sale price from discount.';
        return;
      }
      salePrice = this.draft.mrp * (1 - value / 100);
    }

    const rounded = Math.round((salePrice + Number.EPSILON) * 100) / 100;
    if (!Number.isFinite(rounded) || rounded > 99999999.99) {
      this.calculationError = 'The calculated sale price exceeds the supported maximum.';
      return;
    }
    this.draft.salePrice = rounded;
    this.calculationError = '';
    this.syncPercentages();
  }

  private syncPercentages(): void {
    const { salePrice, mrp } = this.draft;
    if (this.pricingMode !== 'margin') {
      this.marginPercentage = this.profitMargin === null ? null : Math.round(this.profitMargin * 10000) / 100;
    }
    if (this.pricingMode !== 'discount') {
      this.discountPercentage = validPrice(mrp) && mrp > 0 && validPrice(salePrice)
        ? Math.round((mrp - salePrice) / mrp * 10000) / 100
        : null;
    }
  }

  ngOnInit(): void {
    this.loadProducts();
    this.api.getCategories().subscribe({
      next: (categories) => {
        this.categories = this.flattenCategories(categories);
        this.categoryOptions = this.buildCategoryOptions(this.categories);
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
    this.api.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  tabCounts = { active: 0, inactive: 0 };

  viewerProduct: Product | null = null;
  viewerImages: ProductImage[] = [];
  viewerIndex = 0;
  viewerLoading = false;
  viewerError = '';
  viewerFailedImages = new Set<number>();

  get viewerProfit(): number | null {
    const product = this.viewerProduct;
    return product && validPrice(product.salePrice) && validPrice(product.costPrice)
      ? product.salePrice - product.costPrice : null;
  }

  get viewerMargin(): number | null {
    const product = this.viewerProduct;
    return product ? priceRatio(product.salePrice, product.costPrice, product.salePrice) : null;
  }

  get viewerMarkup(): number | null {
    const product = this.viewerProduct;
    return product ? priceRatio(product.salePrice, product.costPrice, product.costPrice) : null;
  }

  get viewerCurrent(): ProductImage | null {
    return this.viewerImages[this.viewerIndex] ?? null;
  }

  assetUrl(url: string): string {
    return this.api.resolveAssetUrl(url);
  }

  openImageViewer(product: Product): void {
    this.viewerSubscription?.unsubscribe();
    this.viewerProduct = product;
    this.viewerImages = [];
    this.viewerIndex = 0;
    this.viewerError = '';
    this.viewerFailedImages.clear();
    this.viewerLoading = true;
    const fetchPage = (pageNumber: number) =>
      this.api.getProductImages({
        pageNumber,
        pageSize: 100,
        searchTerm: '',
        productId: product.id,
        sortBy: 'sortOrder',
        sortDirection: 'asc',
        isActive: product.isActive,
      });
    this.viewerSubscription = fetchPage(1)
      .pipe(
        expand((page) =>
          page.items.length && page.pageNumber * page.pageSize < page.totalCount
            ? fetchPage(page.pageNumber + 1)
            : EMPTY,
        ),
        reduce((images, page) => [...images, ...page.items], [] as ProductImage[]),
      )
      .subscribe({
        next: (images) => {
          this.viewerImages = images;
          this.viewerLoading = false;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.viewerError = getApiErrorMessage(error);
          this.viewerLoading = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  closeImageViewer(): void {
    this.viewerSubscription?.unsubscribe();
    this.viewerProduct = null;
  }

  ngOnDestroy(): void {
    this.viewerSubscription?.unsubscribe();
  }

  selectViewerImage(index: number): void {
    this.viewerIndex = index;
  }

  imageFailed(id: number): void {
    this.viewerFailedImages.add(id);
  }

  stepViewer(step: number): void {
    const count = this.viewerImages.length;
    if (count) {
      this.viewerIndex = (this.viewerIndex + step + count) % count;
    }
  }

  private loadTabCounts(): void {
    for (const isActive of [true, false]) {
      this.api.getProducts(this.searchTerm, 1, 1, 'newest', isActive).subscribe({
        next: (page) => {
          this.tabCounts = { ...this.tabCounts, [isActive ? 'active' : 'inactive']: page.totalCount };
          this.changeDetector.markForCheck();
        },
      });
    }
  }

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';
    this.loadTabCounts();
    const sortKey = this.sortBy === 'salePrice' ? 'price' : this.sortBy;
    this.api
      .getProducts(this.searchTerm, this.pageNumber, this.pageSize, `${sortKey}_${this.sortDirection}`, this.activeTab === 'active')
      .subscribe({
      next: (response) => {
        const lastPage = Math.max(1, Math.ceil(response.totalCount / this.pageSize));
        if (this.pageNumber > lastPage) {
          this.pageNumber = lastPage;
          this.loadProducts();
          return;
        }
        this.products = response.items;
        this.totalCount = response.totalCount;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  selectTab(tab: 'active' | 'inactive'): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.pageNumber = 1;
    this.loadProducts();
  }

  restore(product: Product): void {
    this.errorMessage = '';
    this.successMessage = '';
    const payload: ProductPayload = {
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      categoryId: product.categoryId,
      brandId: product.brandId,
      mrp: product.mrp,
      salePrice: product.salePrice,
      costPrice: product.costPrice ?? 0,
      shortDesc: product.shortDesc ?? '',
      description: product.description ?? '',
      stock: product.stock,
      metaTitle: product.metaTitle ?? '',
      metaDesc: product.metaDesc ?? '',
      isActive: true,
    };
    this.api.updateProduct(product.id, payload).subscribe({
      next: () => {
        this.successMessage = 'Product restored to Active.';
        this.loadProducts();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  search(): void {
    this.pageNumber = 1;
    this.loadProducts();
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size);
    this.pageNumber = 1;
    this.loadProducts();
  }

  sort(field: ProductSortField): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.pageNumber = 1;
    this.loadProducts();
  }

  sortIndicator(field: ProductSortField): string {
    if (this.sortBy !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  ariaSort(field: ProductSortField): 'ascending' | 'descending' | 'none' {
    if (this.sortBy !== field) {
      return 'none';
    }
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  changePage(pageNumber: number): void {
    const lastPage = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
    if (pageNumber < 1 || pageNumber > lastPage) {
      return;
    }
    this.pageNumber = pageNumber;
    this.loadProducts();
  }

  startCreate(): void {
    this.editingId = null;
    this.draft = emptyProductDraft();
    this.pricingMode = 'margin';
    this.pricingRate = 0;
    this.marginPercentage = 0;
    this.calculationError = 'Enter a cost price above zero to calculate the sale price from margin.';
    this.syncPercentages();
    this.successMessage = '';
    this.errorMessage = '';
  }

  edit(product: Product): void {
    this.editingId = product.id;
    this.draft = {
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      categoryId: product.categoryId,
      brandId: product.brandId,
      mrp: product.mrp,
      salePrice: product.salePrice,
      costPrice: product.costPrice ?? 0,
      shortDesc: product.shortDesc ?? '',
      description: product.description ?? '',
      stock: product.stock,
      metaTitle: product.metaTitle ?? '',
      metaDesc: product.metaDesc ?? '',
      isActive: product.isActive,
    };
    this.pricingMode = null;
    this.pricingRate = null;
    this.calculationError = '';
    this.syncPercentages();
    if (product.costPrice > 0 && product.salePrice > 0) {
      this.pricingMode = 'margin';
      this.pricingRate = (product.salePrice - product.costPrice) / product.salePrice * 100;
    } else if (product.mrp > 0 && product.salePrice <= product.mrp) {
      this.pricingMode = 'discount';
      this.pricingRate = (product.mrp - product.salePrice) / product.mrp * 100;
    }
    this.successMessage = '';
    this.errorMessage = '';
    document.querySelector('.editor-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.startCreate();
  }

  saveProduct(): void {
    if (this.calculationError) {
      this.errorMessage = this.calculationError;
      return;
    }
    const categoryId = this.draft.categoryId;
    const brandId = this.draft.brandId;
    if (categoryId === null || categoryId < 1 || brandId === null || brandId < 1) {
      this.errorMessage = 'Select both a category and a brand before saving.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: ProductPayload = { ...this.draft, categoryId, brandId };
    const request =
      this.editingId === null
        ? this.api.createProduct(payload)
        : this.api.updateProduct(this.editingId, payload);

    request.subscribe({
      next: () => {
        const message =
          this.editingId === null ? 'Product created.' : 'Product changes saved.';
        this.startCreate();
        this.successMessage = message;
        this.saving = false;
        this.loadProducts();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.saving = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  productToDelete: Product | null = null;
  deletingProduct = false;

  delete(product: Product): void {
    this.productToDelete = product;
  }

  cancelDelete(): void {
    if (!this.deletingProduct) {
      this.productToDelete = null;
    }
  }

  confirmDelete(): void {
    const product = this.productToDelete;
    if (!product || this.deletingProduct) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.deletingProduct = true;
    const request = product.isActive
      ? this.api.deleteProduct(product.id)
      : this.api.deleteProductPermanently(product.id);
    request.subscribe({
      next: () => {
        this.deletingProduct = false;
        this.productToDelete = null;
        this.successMessage = product.isActive ? 'Product moved to Inactive.' : 'Product permanently deleted.';
        if (this.editingId === product.id) {
          this.startCreate();
        }
        this.loadProducts();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.deletingProduct = false;
        this.productToDelete = null;
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  categoryName(id: number): string {
    return this.categories.find((category) => category.id === id)?.name ?? '—';
  }

  brandName(id: number): string {
    return this.brands.find((brand) => brand.id === id)?.name ?? '—';
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  private flattenCategories(categories: Category[]): Category[] {
    const result = new Map<number, Category>();
    const visit = (category: Category) => {
      result.set(category.id, category);
      category.children?.forEach(visit);
    };
    categories.forEach(visit);
    return [...result.values()];
  }

  private buildCategoryOptions(categories: Category[]): CategoryOption[] {
    const byId = new Map(categories.map((category) => [category.id, category]));
    const children = new Map<number | null, Category[]>();
    for (const category of categories) {
      const parentId = category.parentId !== null && byId.has(category.parentId) ? category.parentId : null;
      const siblings = children.get(parentId) ?? [];
      siblings.push(category);
      children.set(parentId, siblings);
    }
    const compare = (a: Category, b: Category) =>
      a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id - b.id;
    for (const siblings of children.values()) siblings.sort(compare);

    const options: CategoryOption[] = [];
    const visited = new Set<number>();
    const visit = (category: Category, parentPath: string, depth: number) => {
      if (visited.has(category.id)) return;
      visited.add(category.id);
      const path = parentPath ? `${parentPath} / ${category.name}` : category.name;
      const descendants = children.get(category.id) ?? [];
      const treeLabel = '\u00a0'.repeat(depth * 4) + category.name;
      options.push({ category, path, treeLabel, isParent: depth === 0 || descendants.length > 0 });
      descendants.forEach((child) => visit(child, path, depth + 1));
    };
    children.get(null)?.forEach((category) => visit(category, '', 0));
    categories.slice().sort(compare).forEach((category) => visit(category, '', 0));
    return options;
  }
}
