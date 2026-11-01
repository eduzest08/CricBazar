import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./modules/auth/login.component').then((component) => component.LoginComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
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
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
