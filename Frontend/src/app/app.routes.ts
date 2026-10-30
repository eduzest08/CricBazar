import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () =>
      import('./modules/admin/admin.routes').then((routes) => routes.ADMIN_ROUTES),
  },
  {
    path: 'customer',
    loadChildren: () =>
      import('./modules/customer/customer.routes').then(
        (routes) => routes.CUSTOMER_ROUTES,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'admin/products' },
  { path: '**', redirectTo: 'admin/products' },
];
