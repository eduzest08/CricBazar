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
