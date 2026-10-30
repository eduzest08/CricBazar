import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { Category, CategoryDraft } from '../../../core/models/catalog.models';
import { getApiErrorMessage } from '../../../core/utils/api-error';

type CategorySortField = 'name' | 'slug' | 'parent' | 'sortOrder' | 'isActive';

function emptyCategoryDraft(): CategoryDraft {
  return { parentId: null, name: '', slug: '', sortOrder: 0, isActive: true };
}

@Component({
  selector: 'app-category-management',
  imports: [FormsModule],
  templateUrl: './category-management.component.html',
  styleUrl: './category-management.component.scss',
})
export class CategoryManagementComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  categories: Category[] = [];
  readonly pageSizeOptions = [5, 10, 25, 50];
  pageNumber = 1;
  pageSize = 10;
  searchTerm = '';
  sortBy: CategorySortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  draft = emptyCategoryDraft();
  editingId: number | null = null;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getCategories().subscribe({
      next: (categories) => {
        this.categories = this.flattenCategories(categories);
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

  get filteredCategories(): Category[] {
    const term = this.searchTerm.trim().toLowerCase();
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    const value = (category: Category): string | number | boolean =>
      this.sortBy === 'parent'
        ? this.parentName(category.parentId).toLowerCase()
        : (category[this.sortBy] as string | number | boolean);
    const matches = term
      ? this.categories.filter(
          (category) =>
            category.name.toLowerCase().includes(term) || category.slug.toLowerCase().includes(term),
        )
      : this.categories;
    return [...matches].sort((a, b) => {
      const left = value(a);
      const right = value(b);
      const order =
        typeof left === 'string' ? left.localeCompare(String(right)) : Number(left) - Number(right);
      return order * direction || a.id - b.id;
    });
  }

  get totalCount(): number {
    return this.filteredCategories.length;
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  get pagedCategories(): Category[] {
    const page = Math.min(this.pageNumber, this.pageCount);
    return this.filteredCategories.slice((page - 1) * this.pageSize, page * this.pageSize);
  }

  search(): void {
    this.pageNumber = 1;
  }

  changePage(page: number): void {
    this.pageNumber = Math.min(Math.max(1, page), this.pageCount);
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size);
    this.pageNumber = 1;
  }

  sort(field: CategorySortField): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.pageNumber = 1;
  }

  sortIndicator(field: CategorySortField): string {
    if (this.sortBy !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  ariaSort(field: CategorySortField): 'ascending' | 'descending' | 'none' {
    if (this.sortBy !== field) {
      return 'none';
    }
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  edit(category: Category): void {
    this.editingId = category.id;
    this.draft = {
      parentId: category.parentId,
      name: category.name,
      slug: category.slug,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    };
    this.errorMessage = '';
    this.successMessage = '';
    document.querySelector('.editor-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  reset(): void {
    this.editingId = null;
    this.draft = emptyCategoryDraft();
  }

  save(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const request =
      this.editingId === null
        ? this.api.createCategory({
            parentId: this.draft.parentId,
            name: this.draft.name,
            slug: this.draft.slug,
            sortOrder: this.draft.sortOrder,
          })
        : this.api.updateCategory(this.editingId, this.draft);

    request.subscribe({
      next: () => {
        this.successMessage =
          this.editingId === null ? 'Category created.' : 'Category changes saved.';
        this.reset();
        this.saving = false;
        this.loadCategories();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.saving = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  categoryToDelete: Category | null = null;

  delete(category: Category): void {
    this.categoryToDelete = category;
  }

  cancelDelete(): void {
    this.categoryToDelete = null;
  }

  confirmDelete(): void {
    const category = this.categoryToDelete;
    if (!category) {
      return;
    }
    this.categoryToDelete = null;

    this.errorMessage = '';
    this.successMessage = '';
    this.api.deleteCategory(category.id).subscribe({
      next: () => {
        this.successMessage = 'Category deleted.';
        if (this.editingId === category.id) {
          this.reset();
        }
        this.loadCategories();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  parentName(parentId: number | null): string {
    if (parentId === null) {
      return 'Top level';
    }
    return this.categories.find((category) => category.id === parentId)?.name ?? '—';
  }

  private flattenCategories(categories: Category[]): Category[] {
    return categories.flatMap((category) => [
      category,
      ...this.flattenCategories(category.children ?? []),
    ]);
  }
}
