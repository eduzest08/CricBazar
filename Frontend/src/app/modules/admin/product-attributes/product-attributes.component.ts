import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import {
  Product,
  ProductAttribute,
  ProductAttributeDraft,
  ProductAttributeSortField,
} from '../../../core/models/catalog.models';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { ActionIconComponent } from '../shared/action-icon.component';
import { BulkDeleteComponent } from '../shared/bulk-delete.component';

function emptyAttributeDraft(): ProductAttributeDraft {
  return { productId: null, name: '', value: '' };
}

@Component({
  selector: 'app-product-attributes',
  imports: [FormsModule, ActionIconComponent, BulkDeleteComponent],
  templateUrl: './product-attributes.component.html',
  styleUrl: './product-attributes.component.scss',
})
export class ProductAttributesComponent implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly api = inject(CatalogApiService);

  readonly pageSizeOptions = [5, 10, 25, 50];

  attributes: ProductAttribute[] = [];
  products: Product[] = [];
  totalCount = 0;
  pageNumber = 1;
  pageSize = 10;
  searchTerm = '';
  productFilter: number | null = null;
  sortBy: ProductAttributeSortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  draft = emptyAttributeDraft();
  editingId: number | null = null;
  pageView: 'entry' | 'list' = 'list';
  activeTab: 'active' | 'inactive' = 'active';
  filterProducts: Product[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  attributeToDelete: ProductAttribute | null = null;

  ngOnInit(): void {
    this.loadAttributes();
    this.api.getProducts('', 1, 100, 'name_asc').subscribe({
      next: (page) => {
        this.products = page.items;
        this.filterProducts = page.items;
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

  tabCounts = { active: 0, inactive: 0 };

  private loadTabCounts(): void {
    for (const isActive of [true, false]) {
      this.api
        .getProductAttributes({
          pageNumber: 1,
          pageSize: 1,
          searchTerm: this.searchTerm,
          productId: this.productFilter,
          sortBy: this.sortBy,
          sortDirection: this.sortDirection,
          isActive,
        })
        .subscribe({
          next: (page) => {
            this.tabCounts = { ...this.tabCounts, [isActive ? 'active' : 'inactive']: page.totalCount };
            this.changeDetector.markForCheck();
          },
        });
    }
  }

  loadAttributes(): void {
    this.loading = true;
    this.errorMessage = '';
    this.loadTabCounts();
    this.api
      .getProductAttributes({
        pageNumber: this.pageNumber,
        pageSize: this.pageSize,
        searchTerm: this.searchTerm,
        productId: this.productFilter,
        sortBy: this.sortBy,
        sortDirection: this.sortDirection,
        isActive: this.activeTab === 'active',
      })
      .subscribe({
        next: (page) => {
          this.attributes = page.items;
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

  selectTab(tab: 'active' | 'inactive'): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.productFilter = null;
    this.loadFilterProducts();
    this.search();
  }

  private loadFilterProducts(): void {
    this.api.getProducts('', 1, 100, 'name_asc', this.activeTab === 'active').subscribe({
      next: (page) => {
        this.filterProducts = page.items;
        this.changeDetector.markForCheck();
      },
    });
  }

  search(): void {
    this.pageNumber = 1;
    this.loadAttributes();
  }

  changeProductFilter(productId: number | null): void {
    this.productFilter = productId;
    this.search();
  }

  changePage(page: number): void {
    this.pageNumber = Math.min(Math.max(1, page), this.pageCount);
    this.loadAttributes();
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size);
    this.pageNumber = 1;
    this.loadAttributes();
  }

  sort(field: ProductAttributeSortField): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.pageNumber = 1;
    this.loadAttributes();
  }

  sortIndicator(field: ProductAttributeSortField): string {
    if (this.sortBy !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  ariaSort(field: ProductAttributeSortField): 'ascending' | 'descending' | 'none' {
    if (this.sortBy !== field) {
      return 'none';
    }
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  edit(attribute: ProductAttribute): void {
    this.editingId = attribute.id;
    this.pageView = 'entry';
    this.draft = {
      productId: attribute.productId,
      name: attribute.name,
      value: attribute.value,
    };
    this.errorMessage = '';
    this.successMessage = '';
    document.querySelector<HTMLElement>('.management-tabs')?.scrollIntoView?.({ behavior: 'smooth' });
  }

  reset(): void {
    this.editingId = null;
    this.pageView = 'entry';
    this.draft = emptyAttributeDraft();
  }

  selectPageView(view: 'entry' | 'list'): void {
    this.pageView = view;
  }

  save(): void {
    const productId = this.draft.productId;
    if (productId === null) {
      this.errorMessage = 'Select a product.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const isCreate = this.editingId === null;
    const payload = { productId, name: this.draft.name.trim(), value: this.draft.value.trim() };
    const request = isCreate
      ? this.api.createProductAttribute(payload)
      : this.api.updateProductAttribute(this.editingId as number, payload);

    request.subscribe({
      next: () => {
        this.successMessage = isCreate ? 'Attribute created.' : 'Attribute changes saved.';
        this.reset();
        this.pageView = 'list';
        this.saving = false;
        this.loadAttributes();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.saving = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  bulkDeleted(ids: number[]): void {
    if (this.editingId !== null && ids.includes(this.editingId)) {
      this.reset();
      this.pageView = 'list';
    }
    this.loadAttributes();
  }

  delete(attribute: ProductAttribute): void {
    this.attributeToDelete = attribute;
  }

  cancelDelete(): void {
    this.attributeToDelete = null;
  }

  confirmDelete(): void {
    const attribute = this.attributeToDelete;
    if (!attribute) {
      return;
    }
    this.attributeToDelete = null;

    this.errorMessage = '';
    this.successMessage = '';
    this.api.deleteProductAttribute(attribute.id).subscribe({
      next: () => {
        this.successMessage = 'Attribute deleted.';
        if (this.editingId === attribute.id) {
          this.reset();
        }
        this.loadAttributes();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }
}
