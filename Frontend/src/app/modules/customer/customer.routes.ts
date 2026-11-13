import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: 'account/login',
    title: 'Sign In | CricBazar',
    data: { accountMode: 'login' },
    loadComponent: () =>
      import('./customer-account-auth.component').then(
        (component) => component.CustomerAccountAuthComponent,
      ),
  },
  {
    path: 'account/register',
    title: 'Create Account | CricBazar',
    data: { accountMode: 'register' },
    loadComponent: () =>
      import('./customer-account-auth.component').then(
        (component) => component.CustomerAccountAuthComponent,
      ),
  },
  {
    path: 'account/profile',
    title: 'Your Account | CricBazar',
    loadComponent: () =>
      import('./customer-account-profile.component').then(
        (component) => component.CustomerAccountProfileComponent,
      ),
  },
  {
    path: 'home',
    pathMatch: 'full',
    redirectTo: '/',
  },
  {
    path: 'checkout',
    title: 'Checkout | CricBazar',
    loadComponent: () =>
      import('./storefront-checkout.component').then(
        (component) => component.StorefrontCheckoutComponent,
      ),
  },
  {
    path: 'payment',
    title: 'Payment | CricBazar',
    loadComponent: () =>
      import('./storefront-payment.component').then(
        (component) => component.StorefrontPaymentComponent,
      ),
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
