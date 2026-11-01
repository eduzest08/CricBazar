import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import {
  Product,
  ProductImage,
  ProductImageDraft,
  ProductImageSortField,
} from '../../../core/models/catalog.models';
import { getApiErrorMessage } from '../../../core/utils/api-error';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function emptyImageDraft(): ProductImageDraft {
  return { productId: null, url: '', sortOrder: 0 };
}

@Component({
  selector: 'app-product-images',
  imports: [FormsModule],
  templateUrl: './product-images.component.html',
  styleUrl: './product-images.component.scss',
})
export class ProductImagesComponent implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);

  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly api = inject(CatalogApiService);

  images: ProductImage[] = [];
  products: Product[] = [];
  totalCount = 0;
  pageNumber = 1;
  pageSize = 10;
  searchTerm = '';
  productFilter: number | null = null;
  sortBy: ProductImageSortField = 'product';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedFile: File | null = null;
  previewUrl = '';
  draft = emptyImageDraft();
  editingId: number | null = null;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  imageToDelete: ProductImage | null = null;

  viewerProductId: number | null = null;
  viewerImages: ProductImage[] = [];
  viewerIndex = 0;
  viewerLoading = false;

  get viewerCurrent(): ProductImage | null {
    return this.viewerImages[this.viewerIndex] ?? null;
  }

  get viewerProductName(): string {
    return this.products.find((p) => p.id === this.viewerProductId)?.name ?? '';
  }

  changeViewerProduct(productId: number | null): void {
    this.viewerProductId = productId;
    this.loadViewer();
  }

  previewInViewer(image: ProductImage): void {
    this.viewerProductId = image.productId;
    this.loadViewer(image.id);
    document.querySelector('.viewer-card')?.scrollIntoView({ behavior: 'smooth' });
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

  // Mirrors the storefront: ordered by sort order, the first image is the main one
  loadViewer(selectImageId?: number): void {
    if (this.viewerProductId === null) {
      this.viewerImages = [];
      this.viewerIndex = 0;
      return;
    }
    this.viewerLoading = true;
    this.api
      .getProductImages({
        pageNumber: 1,
        pageSize: 100,
        searchTerm: '',
        productId: this.viewerProductId,
        sortBy: 'sortOrder',
        sortDirection: 'asc',
      })
      .subscribe({
        next: (page) => {
          this.viewerImages = page.items;
          const index = page.items.findIndex((i) => i.id === selectImageId);
          this.viewerIndex = index >= 0 ? index : 0;
          this.viewerLoading = false;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.errorMessage = getApiErrorMessage(error);
          this.viewerLoading = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  ngOnInit(): void {
    this.loadImages();
    this.api.getProducts('', 1, 100, 'name_asc').subscribe({
      next: (page) => {
        this.products = page.items;
        if (this.viewerProductId === null && page.items.length) {
          this.viewerProductId = page.items[0].id;
          this.loadViewer();
        }
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

  loadImages(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api
      .getProductImages({
        pageNumber: this.pageNumber,
        pageSize: this.pageSize,
        searchTerm: this.searchTerm,
        productId: this.productFilter,
        sortBy: this.sortBy,
        sortDirection: this.sortDirection,
      })
      .subscribe({
        next: (page) => {
          this.images = page.items;
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
    this.loadImages();
  }

  changeProductFilter(productId: number | null): void {
    this.productFilter = productId;
    this.search();
  }

  changePage(page: number): void {
    this.pageNumber = Math.min(Math.max(1, page), this.pageCount);
    this.loadImages();
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size);
    this.pageNumber = 1;
    this.loadImages();
  }

  sort(field: ProductImageSortField): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.pageNumber = 1;
    this.loadImages();
  }

  sortIndicator(field: ProductImageSortField): string {
    if (this.sortBy !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  ariaSort(field: ProductImageSortField): 'ascending' | 'descending' | 'none' {
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
    if (file && file.size > MAX_IMAGE_BYTES) {
      this.errorMessage = 'Image must be 5 MB or smaller.';
      input.value = '';
      return;
    }
    this.setFile(file);
  }

  removeImage(fileInput: HTMLInputElement): void {
    fileInput.value = '';
    this.setFile(null);
    this.draft.url = '';
    this.previewUrl = '';
  }

  private setFile(file: File | null): void {
    if (this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.selectedFile = file;
    this.previewUrl = file ? URL.createObjectURL(file) : this.api.resolveAssetUrl(this.draft.url);
  }

  edit(image: ProductImage): void {
    this.editingId = image.id;
    this.draft = { productId: image.productId, url: image.url, sortOrder: image.sortOrder };
    this.errorMessage = '';
    this.successMessage = '';
    this.setFile(null);
    document.querySelector('.editor-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  reset(): void {
    this.editingId = null;
    this.draft = emptyImageDraft();
    this.setFile(null);
  }

  save(): void {
    if (this.draft.productId === null) {
      this.errorMessage = 'Select a product.';
      return;
    }
    if (!this.selectedFile && !this.draft.url) {
      this.errorMessage = 'Choose an image to upload.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const uploadStep: Observable<string> = this.selectedFile
      ? this.api.uploadProductImage(this.selectedFile).pipe(map((result) => result.url))
      : of(this.draft.url);

    uploadStep.subscribe({
      next: (url) => this.persist(url),
      error: (error: unknown) => this.fail(error),
    });
  }

  private persist(url: string): void {
    const isCreate = this.editingId === null;
    const payload = {
      productId: this.draft.productId as number,
      url,
      sortOrder: Number(this.draft.sortOrder) || 0,
    };
    const request = isCreate
      ? this.api.createProductImage(payload)
      : this.api.updateProductImage(this.editingId as number, payload);

    request.subscribe({
      next: () => {
        this.successMessage = isCreate ? 'Image added.' : 'Image changes saved.';
        this.reset();
        this.saving = false;
        this.loadImages();
        this.viewerProductId = payload.productId;
        this.loadViewer();
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

  delete(image: ProductImage): void {
    this.imageToDelete = image;
  }

  cancelDelete(): void {
    this.imageToDelete = null;
  }

  confirmDelete(): void {
    const image = this.imageToDelete;
    if (!image) {
      return;
    }
    this.imageToDelete = null;

    this.errorMessage = '';
    this.successMessage = '';
    this.api.deleteProductImage(image.id).subscribe({
      next: () => {
        this.successMessage = 'Image deleted.';
        if (this.editingId === image.id) {
          this.reset();
        }
        this.loadImages();
        this.loadViewer();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }
}
