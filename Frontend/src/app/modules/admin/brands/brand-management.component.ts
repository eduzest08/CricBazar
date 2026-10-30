import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { Brand, BrandDraft, BrandSortField } from '../../../core/models/catalog.models';
import { getApiErrorMessage } from '../../../core/utils/api-error';

function emptyBrandDraft(): BrandDraft {
  return { name: '', slug: '', logoUrl: '', isActive: true };
}

@Component({
  selector: 'app-brand-management',
  imports: [FormsModule],
  templateUrl: './brand-management.component.html',
  styleUrl: './brand-management.component.scss',
})
export class BrandManagementComponent implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly api = inject(CatalogApiService);

  brands: Brand[] = [];
  totalCount = 0;
  pageNumber = 1;
  pageSize = 10;
  searchTerm = '';
  sortBy: BrandSortField = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedFile: File | null = null;
  previewUrl = '';
  draft = emptyBrandDraft();
  editingId: number | null = null;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadBrands();
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  loadBrands(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api
      .getBrandsPage({
        pageNumber: this.pageNumber,
        pageSize: this.pageSize,
        searchTerm: this.searchTerm,
        sortBy: this.sortBy,
        sortDirection: this.sortDirection,
      })
      .subscribe({
        next: (page) => {
          this.brands = page.items;
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
    this.loadBrands();
  }

  changePage(page: number): void {
    this.pageNumber = Math.min(Math.max(1, page), this.pageCount);
    this.loadBrands();
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size);
    this.pageNumber = 1;
    this.loadBrands();
  }

  sort(field: BrandSortField): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.pageNumber = 1;
    this.loadBrands();
  }

  sortIndicator(field: BrandSortField): string {
    if (this.sortBy !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  ariaSort(field: BrandSortField): 'ascending' | 'descending' | 'none' {
    if (this.sortBy !== field) {
      return 'none';
    }
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.errorMessage = '';
    if (file && !file.type.startsWith('image/')) {
      this.errorMessage = 'Please choose an image file.';
      input.value = '';
      return;
    }
    if (file && file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'Logo must be 2 MB or smaller.';
      input.value = '';
      return;
    }
    this.setFile(file);
  }

  removeLogo(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    this.setFile(null);
    this.draft.logoUrl = '';
  }

  private setFile(file: File | null): void {
    if (this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.selectedFile = file;
    this.previewUrl = file ? URL.createObjectURL(file) : this.api.resolveAssetUrl(this.draft.logoUrl);
  }

  edit(brand: Brand): void {
    this.editingId = brand.id;
    this.draft = {
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoUrl ?? '',
      isActive: brand.isActive,
    };
    this.errorMessage = '';
    this.successMessage = '';
    this.setFile(null);
    document.querySelector('.editor-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  reset(): void {
    this.editingId = null;
    this.draft = emptyBrandDraft();
    this.setFile(null);
  }

  save(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const logoStep: Observable<string> = this.selectedFile
      ? this.api.uploadBrandLogo(this.selectedFile).pipe(map((result) => result.logoUrl))
      : of(this.draft.logoUrl);

    logoStep.subscribe({
      next: (logoUrl) => this.persist(logoUrl),
      error: (error: unknown) => this.fail(error),
    });
  }

  private persist(logoUrl: string): void {
    const isCreate = this.editingId === null;
    const request = isCreate
      ? this.api.createBrand({ name: this.draft.name, slug: this.draft.slug, logoUrl })
      : this.api.updateBrand(this.editingId as number, { ...this.draft, logoUrl });

    request.subscribe({
      next: () => {
        this.successMessage = isCreate ? 'Brand created.' : 'Brand changes saved.';
        this.reset();
        this.saving = false;
        this.loadBrands();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => this.fail(error),
    });
  }

  private fail(error: unknown): void {
    this.errorMessage = getApiErrorMessage(error);
    this.saving = false;
    this.changeDetector.markForCheck();
  }

  brandToDelete: Brand | null = null;

  delete(brand: Brand): void {
    this.brandToDelete = brand;
  }

  cancelDelete(): void {
    this.brandToDelete = null;
  }

  confirmDelete(): void {
    const brand = this.brandToDelete;
    if (!brand) {
      return;
    }
    this.brandToDelete = null;

    this.errorMessage = '';
    this.successMessage = '';
    this.api.deleteBrand(brand.id).subscribe({
      next: () => {
        this.successMessage = 'Brand deleted.';
        if (this.editingId === brand.id) {
          this.reset();
        }
        this.loadBrands();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }
}
