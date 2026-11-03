import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { RichTextEditorComponent } from '../../../shared/rich-text-editor.component';
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

@Component({
  selector: 'app-product-management',
  imports: [CurrencyPipe, FormsModule, RichTextEditorComponent],
  templateUrl: './product-management.component.html',
  styleUrl: './product-management.component.scss',
})
export class ProductManagementComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  products: Product[] = [];
  categories: Category[] = [];
  brands: Brand[] = [];
  draft = emptyProductDraft();
  editingId: number | null = null;
  searchTerm = '';
  pageNumber = 1;
  readonly pageSizeOptions = [5, 10, 25, 50];
  pageSize = 10;
  sortBy: ProductSortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  totalCount = 0;
  activeTab: 'active' | 'inactive' = 'active';
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadProducts();
    this.api.getCategories().subscribe({
      next: (categories) => {
        this.categories = this.flattenCategories(categories);
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

  get viewerCurrent(): ProductImage | null {
    return this.viewerImages[this.viewerIndex] ?? null;
  }

  assetUrl(url: string): string {
    return this.api.resolveAssetUrl(url);
  }

  openImageViewer(product: Product): void {
    this.viewerProduct = product;
    this.viewerImages = [];
    this.viewerIndex = 0;
    this.viewerError = '';
    this.viewerLoading = true;
    this.api
      .getProductImages({
        pageNumber: 1,
        pageSize: 100,
        searchTerm: '',
        productId: product.id,
        sortBy: 'sortOrder',
        sortDirection: 'asc',
        isActive: true,
      })
      .subscribe({
        next: (page) => {
          this.viewerImages = page.items;
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
    this.viewerProduct = null;
  }

  selectViewerImage(index: number): void {
    this.viewerIndex = index;
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
    this.successMessage = '';
    this.errorMessage = '';
    document.querySelector('.editor-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelEdit(): void {
    this.startCreate();
  }

  saveProduct(): void {
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

  delete(product: Product): void {
    this.productToDelete = product;
  }

  cancelDelete(): void {
    this.productToDelete = null;
  }

  confirmDelete(): void {
    const product = this.productToDelete;
    if (!product) {
      return;
    }
    this.productToDelete = null;

    this.errorMessage = '';
    this.successMessage = '';
    this.api.deleteProduct(product.id).subscribe({
      next: () => {
        this.successMessage = 'Product moved to Inactive.';
        if (this.editingId === product.id) {
          this.startCreate();
        }
        this.loadProducts();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
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
    return categories.flatMap((category) => [
      category,
      ...this.flattenCategories(category.children ?? []),
    ]);
  }
}
