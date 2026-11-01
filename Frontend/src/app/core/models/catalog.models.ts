export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  categoryId: number;
  brandId: number;
  mrp: number;
  salePrice: number;
  discountPct: number;
  shortDesc: string | null;
  description: string | null;
  stock: number;
  avgRating: number;
  reviewCount: number;
  salesCount: number;
  metaTitle: string | null;
  metaDesc: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProductDraft {
  name: string;
  slug: string;
  sku: string;
  categoryId: number | null;
  brandId: number | null;
  mrp: number;
  salePrice: number;
  shortDesc: string;
  description: string;
  stock: number;
  metaTitle: string;
  metaDesc: string;
  isActive: boolean;
}

export type ProductPayload = Omit<ProductDraft, 'categoryId' | 'brandId'> & {
  categoryId: number;
  brandId: number;
};

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
}

export interface CategoryDraft {
  parentId: number | null;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
}

export interface BrandDraft {
  name: string;
  slug: string;
  logoUrl: string;
  isActive: boolean;
}

export type BrandSortField = 'name' | 'slug' | 'id' | 'isActive';

export interface BrandQuery {
  pageNumber: number;
  pageSize: number;
  searchTerm: string;
  sortBy: BrandSortField;
  sortDirection: 'asc' | 'desc';
}

export type ProductSortField = 'name' | 'sku' | 'salePrice' | 'stock' | 'id';

export interface ProductAttribute {
  id: number;
  productId: number;
  productName: string;
  name: string;
  value: string;
}

export interface ProductAttributeDraft {
  productId: number | null;
  name: string;
  value: string;
}

export type ProductAttributePayload = Omit<ProductAttributeDraft, 'productId'> & {
  productId: number;
};

export type ProductAttributeSortField = 'name' | 'value' | 'product' | 'id';

export interface ProductAttributeQuery {
  pageNumber: number;
  pageSize: number;
  searchTerm: string;
  productId: number | null;
  sortBy: ProductAttributeSortField;
  sortDirection: 'asc' | 'desc';
}

export interface ProductVariant {
  id: number;
  productId: number;
  productName: string;
  size: string | null;
  color: string | null;
  hand: string | null;
  stock: number;
  priceOverride: number | null;
}

export interface ProductVariantDraft {
  productId: number | null;
  size: string;
  color: string;
  hand: string;
  stock: number;
  priceOverride: number | null;
}

export interface ProductVariantPayload {
  productId: number;
  size: string | null;
  color: string | null;
  hand: string | null;
  stock: number;
  priceOverride: number | null;
}

export type ProductVariantSortField =
  | 'product'
  | 'size'
  | 'color'
  | 'hand'
  | 'stock'
  | 'priceOverride'
  | 'id';

export interface ProductVariantQuery {
  pageNumber: number;
  pageSize: number;
  searchTerm: string;
  productId: number | null;
  sortBy: ProductVariantSortField;
  sortDirection: 'asc' | 'desc';
}

export interface ProductImage {
  id: number;
  productId: number;
  productName: string;
  url: string;
  sortOrder: number;
}

export interface ProductImageDraft {
  productId: number | null;
  url: string;
  sortOrder: number;
}

export interface ProductImagePayload {
  productId: number;
  url: string;
  sortOrder: number;
}

export type ProductImageSortField = 'product' | 'sortOrder' | 'id';

export interface ProductImageQuery {
  pageNumber: number;
  pageSize: number;
  searchTerm: string;
  productId: number | null;
  sortBy: ProductImageSortField;
  sortDirection: 'asc' | 'desc';
}

export interface Review {
  id: number;
  productId: number;
  productName: string;
  userId: number;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export type ReviewSortField = 'date' | 'product' | 'user' | 'rating';

export interface ReviewQuery {
  pageNumber: number;
  pageSize: number;
  searchTerm: string;
  productId: number | null;
  rating: number | null;
  sortBy: ReviewSortField;
  sortDirection: 'asc' | 'desc';
}

export interface ReviewPayload {
  productId: number;
  rating: number;
  comment: string | null;
}
