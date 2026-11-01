import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { Product, Review, ReviewSortField, ReviewPayload } from '../../../core/models/catalog.models';
import { getApiErrorMessage } from '../../../core/utils/api-error';

const MAX_COMMENT_LENGTH = 2000;

interface ReviewDraft {
  productId: number | null;
  rating: number;
  comment: string;
}

function emptyReviewDraft(): ReviewDraft {
  return { productId: null, rating: 5, comment: '' };
}

@Component({
  selector: 'app-reviews',
  imports: [FormsModule, DatePipe],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.scss',
})
export class ReviewsComponent implements OnInit {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly api = inject(CatalogApiService);

  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly ratingOptions = [5, 4, 3, 2, 1];

  reviews: Review[] = [];
  products: Product[] = [];
  totalCount = 0;
  pageNumber = 1;
  pageSize = 10;
  searchTerm = '';
  productFilter: number | null = null;
  ratingFilter: number | null = null;
  sortBy: ReviewSortField = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  loading = false;
  errorMessage = '';
  successMessage = '';
  reviewToDelete: Review | null = null;
  readonly maxCommentLength = MAX_COMMENT_LENGTH;
  draft = emptyReviewDraft();
  editingId: number | null = null;
  saving = false;

  edit(review: Review): void {
    this.editingId = review.id;
    this.draft = {
      productId: review.productId,
      rating: review.rating,
      comment: review.comment ?? '',
    };
    this.errorMessage = '';
    this.successMessage = '';
    document.querySelector('.editor-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  reset(): void {
    this.editingId = null;
    this.draft = emptyReviewDraft();
  }

  setRating(rating: number): void {
    this.draft.rating = rating;
  }

  save(): void {
    if (this.draft.productId === null) {
      this.errorMessage = 'Select a product.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const isCreate = this.editingId === null;
    const payload: ReviewPayload = {
      productId: this.draft.productId,
      rating: this.draft.rating,
      comment: this.draft.comment.trim() || null,
    };
    const request = isCreate
      ? this.api.createReview(payload)
      : this.api.updateReview(this.editingId as number, payload);

    request.subscribe({
      next: () => {
        this.successMessage = isCreate ? 'Review added.' : 'Review changes saved.';
        this.reset();
        this.saving = false;
        this.loadReviews();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.saving = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  ngOnInit(): void {
    this.loadReviews();
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

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating));
  }

  loadReviews(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api
      .getReviews({
        pageNumber: this.pageNumber,
        pageSize: this.pageSize,
        searchTerm: this.searchTerm,
        productId: this.productFilter,
        rating: this.ratingFilter,
        sortBy: this.sortBy,
        sortDirection: this.sortDirection,
      })
      .subscribe({
        next: (page) => {
          this.reviews = page.items;
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
    this.loadReviews();
  }

  changeProductFilter(productId: number | null): void {
    this.productFilter = productId;
    this.search();
  }

  changeRatingFilter(rating: number | null): void {
    this.ratingFilter = rating;
    this.search();
  }

  changePage(page: number): void {
    this.pageNumber = Math.min(Math.max(1, page), this.pageCount);
    this.loadReviews();
  }

  changePageSize(size: number): void {
    this.pageSize = Number(size);
    this.pageNumber = 1;
    this.loadReviews();
  }

  sort(field: ReviewSortField): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = field === 'date' || field === 'rating' ? 'desc' : 'asc';
    }
    this.pageNumber = 1;
    this.loadReviews();
  }

  sortIndicator(field: ReviewSortField): string {
    if (this.sortBy !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '▲' : '▼';
  }

  ariaSort(field: ReviewSortField): 'ascending' | 'descending' | 'none' {
    if (this.sortBy !== field) {
      return 'none';
    }
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  delete(review: Review): void {
    this.reviewToDelete = review;
  }

  cancelDelete(): void {
    this.reviewToDelete = null;
  }

  confirmDelete(): void {
    const review = this.reviewToDelete;
    if (!review) {
      return;
    }
    this.reviewToDelete = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.api.deleteReview(review.id).subscribe({
      next: () => {
        this.successMessage = 'Review deleted.';
        if (this.editingId === review.id) {
          this.reset();
        }
        this.loadReviews();
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }
}
