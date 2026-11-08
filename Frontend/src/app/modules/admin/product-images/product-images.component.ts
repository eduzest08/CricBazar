import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { EMPTY, Observable, Subscription, concatMap, expand, forkJoin, from, map, mergeMap, of, reduce, tap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import {
  Product,
  ProductImage,
  ProductImageDraft,
} from '../../../core/models/catalog.models';
import { getApiErrorMessage } from '../../../core/utils/api-error';
import { ActionIconComponent } from '../shared/action-icon.component';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function emptyImageDraft(): ProductImageDraft {
  return { productId: null, url: '', sortOrder: 0 };
}

interface ImageGroup {
  productId: number;
  productName: string;
  images: ProductImage[];
}

interface SelectedImage {
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
}

@Component({
  selector: 'app-product-images',
  imports: [FormsModule, ActionIconComponent],
  templateUrl: './product-images.component.html',
  styleUrl: './product-images.component.scss',
})
export class ProductImagesComponent implements OnInit, OnDestroy {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private viewerSubscription?: Subscription;
  private listSubscription?: Subscription;
  private sortOrderSubscription?: Subscription;
  private imageCountsSubscription?: Subscription;
  private readonly expandedProducts = new Set<number>();

  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly api = inject(CatalogApiService);

  images: ProductImage[] = [];
  products: Product[] = [];
  imageCounts = new Map<number, number>();
  imageCountsLoading = false;
  imageCountsError = '';
  pageNumber = 1;
  pageSize = 10;
  searchTerm = '';
  private appliedSearchTerm = '';
  productFilter: number | null = null;
  reordering = false;
  draggingId: number | null = null;
  selectedFile: File | null = null;
  selectedImages: SelectedImage[] = [];
  previewUrl = '';
  draft = emptyImageDraft();
  editingId: number | null = null;
  activeTab: 'active' | 'inactive' = 'active';
  filterProducts: Product[] = [];
  loading = false;
  saving = false;
  sortOrderLoading = false;
  sortOrderError = '';
  activatingId: number | null = null;
  errorMessage = '';
  successMessage = '';
  imageToDelete: ProductImage | null = null;

  viewerProductId: number | null = null;
  viewerImages: ProductImage[] = [];
  viewerIndex = 0;
  viewerLoading = false;
  viewerError = '';
  viewerProductName = '';
  viewerFailedImages = new Set<number>();

  get viewerCurrent(): ProductImage | null {
    return this.viewerImages[this.viewerIndex] ?? null;
  }

  previewInViewer(image: ProductImage): void {
    this.viewerProductId = image.productId;
    this.viewerProductName = image.productName;
    this.loadViewer(image.id, this.activeTab === 'active');
  }

  closeViewer(): void {
    this.viewerSubscription?.unsubscribe();
    this.viewerProductId = null;
    this.viewerImages = [];
    this.viewerLoading = false;
    this.viewerError = '';
  }

  ngOnDestroy(): void {
    this.viewerSubscription?.unsubscribe();
    this.listSubscription?.unsubscribe();
    this.sortOrderSubscription?.unsubscribe();
    this.imageCountsSubscription?.unsubscribe();
    this.clearSelectedImages();
    if (this.previewUrl.startsWith('blob:')) URL.revokeObjectURL(this.previewUrl);
  }

  imageFailed(id: number): void {
    this.viewerFailedImages.add(id);
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

  private loadViewer(selectImageId: number, isActive: boolean): void {
    this.viewerSubscription?.unsubscribe();
    if (this.viewerProductId === null) {
      return;
    }
    const productId = this.viewerProductId;
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
        productId,
        sortBy: 'sortOrder',
        sortDirection: 'asc',
        isActive,
      });
    this.viewerSubscription = fetchPage(1)
      .pipe(
        expand((page) => page.items.length && page.pageNumber * page.pageSize < page.totalCount
          ? fetchPage(page.pageNumber + 1) : EMPTY),
        reduce((images, page) => [...images, ...page.items], [] as ProductImage[]),
      )
      .subscribe({
        next: (images) => {
          this.viewerImages = images;
          const index = images.findIndex((image) => image.id === selectImageId);
          this.viewerIndex = index >= 0 ? index : 0;
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

  ngOnInit(): void {
    this.loadImages();
    this.api.getProducts('', 1, 100, 'name_asc').subscribe({
      next: (page) => {
        this.products = page.items;
        this.filterProducts = page.items;
        this.loadImageCounts();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.imageGroups.length / this.pageSize));
  }

  get totalCount(): number {
    return this.imageGroups.reduce((count, group) => count + group.images.length, 0);
  }

  get imageGroups(): ImageGroup[] {
    const groups = new Map<number, ImageGroup>();
    for (const image of this.images) {
      if (this.productFilter !== null && image.productId !== this.productFilter) continue;
      const group = groups.get(image.productId) ?? { productId: image.productId, productName: image.productName, images: [] };
      group.images.push(image);
      groups.set(image.productId, group);
    }
    const term = this.appliedSearchTerm.trim().toLowerCase();
    return [...groups.values()]
      .filter(group => !term || group.productName.toLowerCase().includes(term) ||
        group.images.some(image => image.url.toLowerCase().includes(term)))
      .map(group => ({ ...group, images: group.images.sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id) }))
      .sort((a, b) => a.productName.localeCompare(b.productName) || a.productId - b.productId);
  }

  get visibleGroups(): ImageGroup[] {
    return this.imageGroups.slice((this.pageNumber - 1) * this.pageSize, this.pageNumber * this.pageSize);
  }

  isExpanded(productId: number): boolean {
    return this.expandedProducts.has(productId);
  }

  toggleGroup(productId: number): void {
    if (this.expandedProducts.has(productId)) this.expandedProducts.delete(productId);
    else this.expandedProducts.add(productId);
  }

  activate(group: ImageGroup): void {
    if (this.activatingId !== null) return;
    this.activatingId = group.productId;
    this.errorMessage = '';
    this.successMessage = '';
    this.api.activateProduct(group.productId).subscribe({
      next: () => {
        this.activatingId = null;
        this.successMessage = `${group.productName} is active.`;
        this.loadImages();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.activatingId = null;
        this.errorMessage = `Could not activate ${group.productName}: ${getApiErrorMessage(error)}`;
        this.changeDetector.markForCheck();
      },
    });
  }

  tabCounts = { active: 0, inactive: 0 };

  loadImageCounts(): void {
    this.imageCountsSubscription?.unsubscribe();
    this.imageCounts = new Map();
    this.imageCountsError = '';
    this.imageCountsLoading = this.products.length > 0;
    this.imageCountsSubscription = from(this.products).pipe(
      mergeMap(product => this.api.getProductImages({
        pageNumber: 1,
        pageSize: 1,
        searchTerm: '',
        productId: product.id,
        sortBy: 'id',
        sortDirection: 'asc',
        isActive: product.isActive,
      }).pipe(map(page => ({ id: product.id, count: page.totalCount }))), 6),
      reduce((counts, result) => counts.set(result.id, result.count), new Map<number, number>()),
    ).subscribe({
      next: counts => {
        this.imageCounts = counts;
        this.imageCountsLoading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.imageCountsLoading = false;
        this.imageCountsError = `Could not load product image counts: ${getApiErrorMessage(error)}`;
        this.changeDetector.markForCheck();
      },
    });
  }

  private loadTabCounts(): void {
    for (const isActive of [true, false]) {
      this.api
        .getProductImages({
          pageNumber: 1,
          pageSize: 1,
          searchTerm: this.appliedSearchTerm,
          productId: this.productFilter,
          sortBy: 'product',
          sortDirection: 'asc',
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

  loadImages(): void {
    this.listSubscription?.unsubscribe();
    if (this.products.length) this.loadImageCounts();
    this.loading = true;
    this.errorMessage = '';
    this.loadTabCounts();
    const fetchPage = (pageNumber: number) => this.api.getProductImages({
        pageNumber,
        pageSize: 100,
        searchTerm: '',
        productId: null,
        sortBy: 'product',
        sortDirection: 'asc',
        isActive: this.activeTab === 'active',
      });
    this.listSubscription = fetchPage(1).pipe(
      expand(page => page.items.length && page.pageNumber * page.pageSize < page.totalCount
        ? fetchPage(page.pageNumber + 1) : EMPTY),
      reduce((items, page) => [...items, ...page.items], [] as ProductImage[]),
    )
      .subscribe({
        next: (items) => {
          this.images = items;
          this.loading = false;
          this.pageNumber = Math.min(this.pageNumber, this.pageCount);
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
    this.appliedSearchTerm = this.searchTerm;
    this.pageNumber = 1;
    this.loadImages();
  }

  changeProductFilter(productId: number | null): void {
    this.productFilter = productId;
    this.search();
  }

  changePage(page: number): void {
    this.pageNumber = Math.min(Math.max(1, page), this.pageCount);
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size);
    this.pageNumber = 1;
  }

  canReorder(group: ImageGroup): boolean {
    return !this.loading && !this.saving && !this.reordering && this.editingId === null &&
      !this.imageToDelete && !this.searchTerm.trim() && !this.appliedSearchTerm.trim() && group.images.length > 1;
  }

  canMove(group: ImageGroup, index: number, step: number): boolean {
    return this.canReorder(group) && index + step >= 0 && index + step < group.images.length;
  }

  moveImage(group: ImageGroup, index: number, step: number): void {
    if (this.canMove(group, index, step)) this.reorder(group, index, index + step);
  }

  dragStart(event: DragEvent, group: ImageGroup, image: ProductImage): void {
    if (!this.canReorder(group) || !event.dataTransfer) {
      event.preventDefault();
      return;
    }
    this.draggingId = image.id;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(image.id));
  }

  dragOver(event: DragEvent, group: ImageGroup, target: ProductImage): void {
    if (this.canReorder(group) && this.draggingId !== target.id && group.images.some(image => image.id === this.draggingId)) {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    }
  }

  drop(event: DragEvent, group: ImageGroup, target: ProductImage): void {
    const index = group.images.findIndex(image => image.id === this.draggingId);
    this.draggingId = null;
    if (index < 0 || !this.canReorder(group)) return;
    const targetIndex = group.images.findIndex(image => image.id === target.id);
    if (targetIndex < 0 || index === targetIndex) return;
    event.preventDefault();
    this.reorder(group, index, targetIndex);
  }

  private reorder(group: ImageGroup, source: number, target: number): void {
    const ordered = [...group.images];
    ordered.splice(target, 0, ordered.splice(source, 1)[0]);
    this.reordering = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.api.reorderProductImages(group.productId, ordered.map(({ id, sortOrder }) => ({ id, sortOrder }))).subscribe({
      next: () => {
        const order = new Map(ordered.map((image, index) => [image.id, index]));
        this.images = this.images.map(image => order.has(image.id) ? { ...image, sortOrder: order.get(image.id)! } : image);
        this.reordering = false;
        this.successMessage = 'Image order saved.';
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.reordering = false;
        this.errorMessage = `Could not save image order: ${getApiErrorMessage(error)} Refresh the list and try again.`;
        this.changeDetector.markForCheck();
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) return;
    this.errorMessage = '';
    if (files.some(file => !file.type.startsWith('image/'))) {
      this.errorMessage = 'Please choose an image file.';
      return;
    }
    if (files.some(file => file.size > MAX_IMAGE_BYTES)) {
      this.errorMessage = 'Image must be 5 MB or smaller.';
      return;
    }
    if (this.editingId !== null) {
      this.setFile(files[0]);
    } else {
      this.selectedImages.push(...files.map(file => ({ file, previewUrl: URL.createObjectURL(file) })));
    }
  }

  removeSelectedImage(index: number): void {
    const [image] = this.selectedImages.splice(index, 1);
    if (image) URL.revokeObjectURL(image.previewUrl);
  }

  private clearSelectedImages(): void {
    for (const image of this.selectedImages) URL.revokeObjectURL(image.previewUrl);
    this.selectedImages = [];
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

  updateSortOrder(productId: number | null): void {
    this.sortOrderSubscription?.unsubscribe();
    this.sortOrderLoading = false;
    this.sortOrderError = '';
    this.draft.sortOrder = 0;
    if (productId === null) return;

    this.sortOrderLoading = true;
    const fetchImages = (isActive: boolean) => this.api.getProductImages({
      pageNumber: 1,
      pageSize: 2,
      searchTerm: '',
      productId,
      sortBy: 'sortOrder',
      sortDirection: 'desc',
      isActive,
    });
    this.sortOrderSubscription = forkJoin([fetchImages(true), fetchImages(false)]).subscribe({
      next: (pages) => {
        const orders = pages.flatMap(page => page.items)
          .filter(image => image.id !== this.editingId)
          .map(image => image.sortOrder);
        this.draft.sortOrder = orders.length ? Math.max(...orders) + 1 : 0;
        this.sortOrderLoading = false;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.sortOrderLoading = false;
        this.sortOrderError = `Could not determine the next sort order: ${getApiErrorMessage(error)}`;
        this.changeDetector.markForCheck();
      },
    });
  }

  edit(image: ProductImage): void {
    if (this.saving) return;
    this.clearSelectedImages();
    this.sortOrderSubscription?.unsubscribe();
    this.sortOrderLoading = false;
    this.sortOrderError = '';
    this.editingId = image.id;
    this.draft = { productId: image.productId, url: image.url, sortOrder: image.sortOrder };
    this.errorMessage = '';
    this.successMessage = '';
    this.setFile(null);
    document.querySelector('.editor-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  reset(): void {
    if (this.saving) return;
    this.clearSelectedImages();
    this.sortOrderSubscription?.unsubscribe();
    this.sortOrderLoading = false;
    this.sortOrderError = '';
    this.editingId = null;
    this.draft = emptyImageDraft();
    this.setFile(null);
  }

  save(): void {
    if (this.saving || this.sortOrderLoading || this.sortOrderError) return;
    if (this.draft.productId === null) {
      this.errorMessage = 'Select a product.';
      return;
    }
    if (!this.selectedImages.length && !this.selectedFile && !this.draft.url) {
      this.errorMessage = 'Choose an image to upload.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.editingId === null && this.selectedImages.length) {
      this.saveSelectedImages(this.draft.productId);
      return;
    }

    const uploadStep: Observable<string> = this.selectedFile
      ? this.api.uploadProductImage(this.selectedFile).pipe(map((result) => result.url))
      : of(this.draft.url);

    uploadStep.subscribe({
      next: (url) => this.persist(url),
      error: (error: unknown) => this.fail(error),
    });
  }

  private saveSelectedImages(productId: number): void {
    let saved = 0;
    const total = this.selectedImages.length;
    from([...this.selectedImages]).pipe(
      concatMap(image => {
        const upload = image.uploadedUrl
          ? of(image.uploadedUrl)
          : this.api.uploadProductImage(image.file).pipe(
            map(result => result.url),
            tap(url => image.uploadedUrl = url),
          );
        return upload.pipe(concatMap(url => this.api.createProductImage({
          productId,
          url,
          sortOrder: Number(this.draft.sortOrder),
        })), tap(() => {
          saved++;
          this.draft.sortOrder = Number(this.draft.sortOrder) + 1;
          this.removeSelectedImage(this.selectedImages.indexOf(image));
        }));
      }),
    ).subscribe({
      complete: () => {
        this.saving = false;
        this.reset();
        this.successMessage = `${total} image(s) added.`;
        this.loadImages();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.saving = false;
        this.errorMessage = `${saved} of ${total} images saved. ${getApiErrorMessage(error)} Remaining images can be retried.`;
        if (saved) {
          this.loadImages();
          this.errorMessage = `${saved} of ${total} images saved. ${getApiErrorMessage(error)} Remaining images can be retried.`;
        }
        this.changeDetector.markForCheck();
      },
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
        this.saving = false;
        this.reset();
        this.loadImages();
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
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }
}
