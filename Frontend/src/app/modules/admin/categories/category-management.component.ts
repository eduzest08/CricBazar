import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActionIconComponent } from '../shared/action-icon.component';
import { FormsModule } from '@angular/forms';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { Category, CategoryDraft } from '../../../core/models/catalog.models';
import { getApiErrorMessage } from '../../../core/utils/api-error';

type CategorySortField = 'name' | 'slug' | 'parent' | 'sortOrder' | 'isActive';

interface CategoryRow {
  category: Category;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
}

interface CategoryTree {
  rows: CategoryRow[];
  totalCount: number;
  groupCount: number;
  pageCount: number;
  hasInvalidHierarchy: boolean;
}

function emptyCategoryDraft(): CategoryDraft {
  return { parentId: null, name: '', slug: '', sortOrder: 0, isActive: true };
}

@Component({
  selector: 'app-category-management',
  imports: [FormsModule, ActionIconComponent],
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
  reordering = false;
  draggingId: number | null = null;
  errorMessage = '';
  successMessage = '';
  private readonly expandedIds = new Set<number>();
  private readonly collapsedSearchIds = new Set<number>();
  private hierarchyInvalid = false;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getCategories().subscribe({
      next: (categories) => {
        this.categories = this.flattenCategories(categories);
        const ids = new Set(this.categories.map((category) => category.id));
        for (const id of this.expandedIds) {
          if (!ids.has(id)) this.expandedIds.delete(id);
        }
        const tree = this.categoryTree;
        this.hierarchyInvalid = tree.hasInvalidHierarchy;
        this.pageNumber = Math.min(this.pageNumber, tree.pageCount);
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

  get categoryTree(): CategoryTree {
    const term = this.searchTerm.trim().toLowerCase();
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    const value = (category: Category): string | number | boolean =>
      this.sortBy === 'parent'
        ? this.parentName(category.parentId).toLowerCase()
        : (category[this.sortBy] as string | number | boolean);
    const compare = (a: Category, b: Category) => {
      const left = value(a);
      const right = value(b);
      const order =
        typeof left === 'string' ? left.localeCompare(String(right)) : Number(left) - Number(right);
      return order * direction ||
        (this.sortBy === 'sortOrder' ? a.name.localeCompare(b.name) : 0) || a.id - b.id;
    };
    const byId = new Map(this.categories.map((category) => [category.id, category]));
    const parents = new Map<number, number | null>();
    let hasInvalidHierarchy = false;
    for (const category of this.categories) {
      if (category.parentId !== null && !byId.has(category.parentId)) {
        hasInvalidHierarchy = true;
        parents.set(category.id, null);
      } else {
        parents.set(category.id, category.parentId);
      }
    }
    for (const category of this.categories) {
      const path: number[] = [];
      const positions = new Map<number, number>();
      let id: number | null = category.id;
      while (id !== null) {
        const previous = positions.get(id);
        if (previous !== undefined) {
          const cycle = path.slice(previous);
          parents.set(Math.min(...cycle), null);
          hasInvalidHierarchy = true;
          break;
        }
        positions.set(id, path.length);
        path.push(id);
        id = parents.get(id) ?? null;
      }
    }
    const matches = this.categories.filter((category) =>
      !term || category.name.toLowerCase().includes(term) || category.slug.toLowerCase().includes(term));
    const included = new Set<number>();
    for (const category of matches) {
      let id: number | null = category.id;
      while (id !== null && !included.has(id)) {
        included.add(id);
        id = parents.get(id) ?? null;
      }
    }
    const children = new Map<number | null, Category[]>();
    for (const category of this.categories) {
      if (!included.has(category.id)) continue;
      const parent = parents.get(category.id) ?? null;
      const siblings = children.get(parent) ?? [];
      siblings.push(category);
      children.set(parent, siblings);
    }
    for (const [parentId, siblings] of children) {
      siblings.sort(parentId === null
        ? compare
        : (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id - b.id);
    }
    const roots = children.get(null) ?? [];
    const pageCount = Math.max(1, Math.ceil(roots.length / this.pageSize));
    const page = Math.min(this.pageNumber, pageCount);
    const rows: CategoryRow[] = [];
    const visit = (category: Category, depth: number) => {
      const descendants = children.get(category.id) ?? [];
      const hasChildren = descendants.length > 0;
      const expanded = hasChildren && (term ? !this.collapsedSearchIds.has(category.id) : this.expandedIds.has(category.id));
      rows.push({ category, depth, hasChildren, expanded });
      if (expanded) descendants.forEach((child) => visit(child, depth + 1));
    };
    roots.slice((page - 1) * this.pageSize, page * this.pageSize).forEach((root) => visit(root, 0));
    return { rows, totalCount: matches.length, groupCount: roots.length, pageCount, hasInvalidHierarchy };
  }

  search(): void {
    this.pageNumber = 1;
    this.collapsedSearchIds.clear();
  }

  toggleCategory(row: CategoryRow): void {
    const collapsed = !!this.searchTerm.trim();
    const ids = collapsed ? this.collapsedSearchIds : this.expandedIds;
    const shouldAdd = collapsed ? row.expanded : !row.expanded;
    if (shouldAdd) ids.add(row.category.id);
    else ids.delete(row.category.id);
  }

  canReorder(category: Category): boolean {
    return category.parentId !== null && !this.loading && !this.saving && !this.reordering && this.editingId === null && !this.categoryToDelete &&
      !this.searchTerm.trim() && !this.hierarchyInvalid &&
      this.siblings(category).length > 1;
  }

  private siblings(category: Category): Category[] {
    return this.categories.filter((item) => item.parentId === category.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id - b.id);
  }

  canMove(category: Category, step: number): boolean {
    const siblings = this.siblings(category);
    const index = siblings.findIndex((item) => item.id === category.id);
    return this.canReorder(category) && index >= 0 && index + step >= 0 && index + step < siblings.length;
  }

  moveCategory(category: Category, step: number): void {
    if (!this.canMove(category, step)) return;
    const siblings = this.siblings(category);
    const index = siblings.findIndex((item) => item.id === category.id);
    this.reorder(category, siblings[index + step]);
  }

  dragStart(event: DragEvent, category: Category): void {
    if (!this.canReorder(category) || !event.dataTransfer) {
      event.preventDefault();
      return;
    }
    this.draggingId = category.id;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(category.id));
  }

  dragOver(event: DragEvent, target: Category): void {
    const source = this.categories.find((category) => category.id === this.draggingId);
    if (source && source.id !== target.id && source.parentId === target.parentId && this.canReorder(target)) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    }
  }

  drop(event: DragEvent, target: Category): void {
    const source = this.categories.find((category) => category.id === this.draggingId);
    this.draggingId = null;
    if (!source || source.id === target.id || source.parentId !== target.parentId || !this.canReorder(source)) return;
    event.preventDefault();
    this.reorder(source, target);
  }

  private reorder(source: Category, target: Category): void {
    const siblings = this.siblings(source);
    const sourceIndex = siblings.findIndex((item) => item.id === source.id);
    const targetIndex = siblings.findIndex((item) => item.id === target.id);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
    siblings.splice(sourceIndex, 1);
    siblings.splice(targetIndex, 0, source);
    this.reordering = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.api.reorderCategories(source.parentId, siblings.map(({ id, sortOrder }) => ({ id, sortOrder }))).subscribe({
      next: () => {
        this.categories = this.categories.map((category) => {
          const index = siblings.findIndex((item) => item.id === category.id);
          return index < 0 ? category : { ...category, sortOrder: index };
        });
        this.successMessage = 'Category order saved.';
        this.reordering = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.reordering = false;
        this.errorMessage = `Could not save category order: ${getApiErrorMessage(error)} Refresh the list and try again.`;
        this.changeDetector.markForCheck();
      },
    });
  }

  changePage(page: number): void {
    this.pageNumber = Math.min(Math.max(1, page), this.categoryTree.pageCount);
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
