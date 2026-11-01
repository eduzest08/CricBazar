import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(
            (component) => component.DashboardComponent,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/product-management.component').then(
            (component) => component.ProductManagementComponent,
          ),
      },
      {
        path: 'product-attributes',
        loadComponent: () =>
          import('./product-attributes/product-attributes.component').then(
            (component) => component.ProductAttributesComponent,
          ),
      },
      {
        path: 'product-variants',
        loadComponent: () =>
          import('./product-variants/product-variants.component').then(
            (component) => component.ProductVariantsComponent,
          ),
      },
      {
        path: 'product-images',
        loadComponent: () =>
          import('./product-images/product-images.component').then(
            (component) => component.ProductImagesComponent,
          ),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./reviews/reviews.component').then((component) => component.ReviewsComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./categories/category-management.component').then(
            (component) => component.CategoryManagementComponent,
          ),
      },
      {
        path: 'brands',
        loadComponent: () =>
          import('./brands/brand-management.component').then(
            (component) => component.BrandManagementComponent,
          ),
      },
    ],
  },
];
