import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Brand,
  BrandDraft,
  BrandQuery,
  Category,
  CategoryDraft,
  PaginatedResponse,
  Product,
  ProductAttribute,
  ProductAttributePayload,
  ProductAttributeQuery,
  ProductDraft,
  ProductImage,
  ProductImagePayload,
  ProductImageQuery,
  Review,
  ReviewPayload,
  ReviewQuery,
  ProductPayload,
  ProductVariant,
  ProductVariantPayload,
  ProductVariantQuery,
} from '../models/catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getProducts(
    searchTerm = '',
    pageNumber = 1,
    pageSize = 20,
    sortBy = 'newest',
  ): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize)
      .set('sortBy', sortBy);
    if (searchTerm.trim()) {
      params = params.set('searchTerm', searchTerm.trim());
    }

    return this.http.get<PaginatedResponse<Product>>(`${this.baseUrl}/products`, {
      params,
    });
  }

  createProduct(product: ProductPayload): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products`, product);
  }

  updateProduct(id: number, product: ProductPayload): Observable<Product> {
    return this.http.put<Product>(`${this.baseUrl}/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/products/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`, {
      params: new HttpParams().set('onlyActive', false),
    });
  }

  createCategory(
    category: Omit<CategoryDraft, 'isActive'>,
  ): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories`, category);
  }

  updateCategory(id: number, category: CategoryDraft): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.baseUrl}/brands`, {
      params: new HttpParams().set('onlyActive', false),
    });
  }

  getBrandsPage(
    query: BrandQuery,
  ): Observable<PaginatedResponse<Brand>> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDirection', query.sortDirection);
    if (query.searchTerm.trim()) {
      params = params.set('searchTerm', query.searchTerm.trim());
    }

    return this.http.get<PaginatedResponse<Brand>>(`${this.baseUrl}/brands/paged`, {
      params,
    });
  }

  uploadBrandLogo(file: File): Observable<{ logoUrl: string }> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<{ logoUrl: string }>(`${this.baseUrl}/brands/logo`, body);
  }

  /** Resolves a relative upload path (e.g. /uploads/..) against the API origin. */
  resolveAssetUrl(url: string | null | undefined): string {
    if (!url) {
      return '';
    }
    return /^https?:\/\//i.test(url) ? url : new URL(url, this.baseUrl).href;
  }

  createBrand(brand: Omit<BrandDraft, 'isActive'>): Observable<Brand> {
    return this.http.post<Brand>(`${this.baseUrl}/brands`, brand);
  }

  updateBrand(id: number, brand: BrandDraft): Observable<Brand> {
    return this.http.put<Brand>(`${this.baseUrl}/brands/${id}`, brand);
  }

  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/brands/${id}`);
  }

  getProductAttributes(
    query: ProductAttributeQuery,
  ): Observable<PaginatedResponse<ProductAttribute>> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDirection', query.sortDirection);
    if (query.searchTerm.trim()) {
      params = params.set('searchTerm', query.searchTerm.trim());
    }
    if (query.productId !== null) {
      params = params.set('productId', query.productId);
    }

    return this.http.get<PaginatedResponse<ProductAttribute>>(
      `${this.baseUrl}/product-attributes`,
      { params },
    );
  }

  createProductAttribute(attribute: ProductAttributePayload): Observable<ProductAttribute> {
    return this.http.post<ProductAttribute>(`${this.baseUrl}/product-attributes`, attribute);
  }

  updateProductAttribute(
    id: number,
    attribute: ProductAttributePayload,
  ): Observable<ProductAttribute> {
    return this.http.put<ProductAttribute>(`${this.baseUrl}/product-attributes/${id}`, attribute);
  }

  deleteProductAttribute(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/product-attributes/${id}`);
  }

  getProductVariants(query: ProductVariantQuery): Observable<PaginatedResponse<ProductVariant>> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDirection', query.sortDirection);
    if (query.searchTerm.trim()) {
      params = params.set('searchTerm', query.searchTerm.trim());
    }
    if (query.productId !== null) {
      params = params.set('productId', query.productId);
    }

    return this.http.get<PaginatedResponse<ProductVariant>>(`${this.baseUrl}/product-variants`, {
      params,
    });
  }

  createProductVariant(variant: ProductVariantPayload): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(`${this.baseUrl}/product-variants`, variant);
  }

  updateProductVariant(id: number, variant: ProductVariantPayload): Observable<ProductVariant> {
    return this.http.put<ProductVariant>(`${this.baseUrl}/product-variants/${id}`, variant);
  }

  deleteProductVariant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/product-variants/${id}`);
  }

  getProductImages(query: ProductImageQuery): Observable<PaginatedResponse<ProductImage>> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDirection', query.sortDirection);
    if (query.searchTerm.trim()) {
      params = params.set('searchTerm', query.searchTerm.trim());
    }
    if (query.productId !== null) {
      params = params.set('productId', query.productId);
    }

    return this.http.get<PaginatedResponse<ProductImage>>(`${this.baseUrl}/product-images`, {
      params,
    });
  }

  uploadProductImage(file: File): Observable<{ url: string }> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<{ url: string }>(`${this.baseUrl}/product-images/upload`, body);
  }

  createProductImage(image: ProductImagePayload): Observable<ProductImage> {
    return this.http.post<ProductImage>(`${this.baseUrl}/product-images`, image);
  }

  updateProductImage(id: number, image: ProductImagePayload): Observable<ProductImage> {
    return this.http.put<ProductImage>(`${this.baseUrl}/product-images/${id}`, image);
  }

  deleteProductImage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/product-images/${id}`);
  }

  getReviews(query: ReviewQuery): Observable<PaginatedResponse<Review>> {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDirection', query.sortDirection);
    if (query.searchTerm.trim()) {
      params = params.set('searchTerm', query.searchTerm.trim());
    }
    if (query.productId !== null) {
      params = params.set('productId', query.productId);
    }
    if (query.rating !== null) {
      params = params.set('rating', query.rating);
    }

    return this.http.get<PaginatedResponse<Review>>(`${this.baseUrl}/admin/reviews`, { params });
  }

  createReview(review: ReviewPayload): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/admin/reviews`, review);
  }

  updateReview(id: number, review: ReviewPayload): Observable<Review> {
    return this.http.put<Review>(`${this.baseUrl}/admin/reviews/${id}`, review);
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/reviews/${id}`);
  }
}
