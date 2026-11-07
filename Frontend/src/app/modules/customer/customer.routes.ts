import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: 'home',
    pathMatch: 'full',
    redirectTo: '/',
  },
  {
    path: 'category/:id',
    title: 'Category | CricDynamics',
    loadComponent: () =>
      import('./storefront-placeholder.component').then(
        (component) => component.StorefrontPlaceholderComponent,
      ),
  },
  {
    path: 'product/:id',
    title: 'Product Details | CricDynamics',
    loadComponent: () =>
      import('./storefront-product.component').then(
        (component) => component.StorefrontProductComponent,
      ),
  },
  {
    path: '',
    title: 'Cricket Gear | CricBazar',
    loadComponent: () =>
      import('./storefront-placeholder.component').then(
        (component) => component.StorefrontPlaceholderComponent,
      ),
  },
];
