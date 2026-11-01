import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import {
  Product,
  ProductVariant,
  ProductVariantDraft,
  ProductVariantSortField,
} from '../../../core/models/catalog.models';
import { getApiErrorMessage } from '../../../core/utils/api-error';

function emptyVariantDraft(): ProductVariantDraft {
  return { productId: null, size: '', color: '', hand: '', stock: 0, priceOverride: null };
}

@Component({
  selector: 'app-product-variants',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './product-variants.component.html',
  styleUrl: './product-variants.component.scss',
})
export class ProductVariantsComponent implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly api = inject(CatalogApiService);

  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly handOptions = ['Right', 'Left'];

  variants: ProductVariant[] = [];
  products: Product[] = [];
  totalCount = 0;
  pageNumber = 1;
  pageSize = 10;
  searchTerm = '';
  productFilter: number | null = null;
  sortBy: ProductVariantSortField = 'product';
  sortDirection: 'asc' | 'desc' = 'asc';
  draft = emptyVariantDraft();
  editingId: number | null = null;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  variantToDelete: ProductVariant | null = null;

  ngOnInit(): void {
    this.loadVariants();
    this.api.getProducts('', 1, 100, 'name_asc').subscribe({
      next: (page) => {
        this.products = page.items;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  loadVariants(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api
      .getProductVariants({
        pageNumber: this.pageNumber,
        pageSize: this.pageSize,
        searchTerm: this.searchTerm,
        productId: this.productFilter,
        sortBy: this.sortBy,
        sortDirection: this.sortDirection,
      })
      .subscribe({
        next: (page) => {
          this.variants = page.items;
          this.totalCount = page.totalCount;
          this.loading = false;
          if (!page.items.length && this.pageNumber > this.pageCount) {
            this.changePage(this.pageCount);
            return;
          }
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = getApiErrorMessage(error);
          this.loading = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  search(): void {
    this.pageNumber = 1;
    this.loadVariants();
  }

  changeProductFilter(productId: number | null): void {
    this.productFilter = productId;
    this.search();
  }

  changePage(page: number): void {
    this.pageNumber = Math.min(Math.max(1, page), this.pageCount);
    this.loadVariants();
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size);
    this.pageNumber = 1;
    this.loadVariants();
  }

  sort(field: ProductVariantSortField): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.pageNumber = 1;
    this.loadVariants();
  }

  sortIndicator(field: ProductVariantSortField): string {
    if (this.sortBy !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  ariaSort(field: ProductVariantSortField): 'ascending' | 'descending' | 'none' {
    if (this.sortBy !== field) {
      return 'none';
    }
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  edit(variant: ProductVariant): void {
    this.editingId = variant.id;
    this.draft = {
      productId: variant.productId,
      size: variant.size ?? '',
      color: variant.color ?? '',
      hand: variant.hand ?? '',
      stock: variant.stock,
      priceOverride: variant.priceOverride,
    };
    this.errorMessage = '';
    this.successMessage = '';
    document.querySelector('.editor-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  reset(): void {
    this.editingId = null;
    this.draft = emptyVariantDraft();
  }

  save(): void {
    const productId = this.draft.productId;
    if (productId === null) {
      this.errorMessage = 'Select a product.';
      return;
    }
    const size = this.draft.size.trim();
    const color = this.draft.color.trim();
    const hand = this.draft.hand.trim();
    if (!size && !color && !hand) {
      this.errorMessage = 'Enter at least one of size, color or hand.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const isCreate = this.editingId === null;
    const payload = {
      productId,
      size: size || null,
      color: color || null,
      hand: hand || null,
      stock: Number(this.draft.stock) || 0,
      priceOverride:
        this.draft.priceOverride === null || `${this.draft.priceOverride}` === ''
          ? null
          : Number(this.draft.priceOverride),
    };
    const request = isCreate
      ? this.api.createProductVariant(payload)
      : this.api.updateProductVariant(this.editingId as number, payload);

    request.subscribe({
      next: () => {
        this.successMessage = isCreate ? 'Variant created.' : 'Variant changes saved.';
        this.reset();
        this.saving = false;
        this.loadVariants();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.saving = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  describe(variant: ProductVariant): string {
    return [variant.size, variant.color, variant.hand].filter(Boolean).join(' / ');
  }

  delete(variant: ProductVariant): void {
    this.variantToDelete = variant;
  }

  cancelDelete(): void {
    this.variantToDelete = null;
  }

  confirmDelete(): void {
    const variant = this.variantToDelete;
    if (!variant) {
      return;
    }
    this.variantToDelete = null;

    this.errorMessage = '';
    this.successMessage = '';
    this.api.deleteProductVariant(variant.id).subscribe({
      next: () => {
        this.successMessage = 'Variant deleted.';
        if (this.editingId === variant.id) {
          this.reset();
        }
        this.loadVariants();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }
}
