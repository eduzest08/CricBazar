import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./storefront-placeholder.component').then(
        (component) => component.StorefrontPlaceholderComponent,
      ),
  },
];
