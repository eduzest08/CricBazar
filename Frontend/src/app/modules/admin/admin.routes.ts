import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'products' },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/product-management.component').then(
            (component) => component.ProductManagementComponent,
          ),
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
