# CricBazar Frontend

Angular 22 standalone application with an admin catalog console and a customer storefront placeholder. Authentication is intentionally not enabled.

## Development server

To start a local development server, run:

```bash
ng serve
```

Run the API from `Backend/src/CricketBazar.API` first, then run the frontend:

```bash
npm install
npm start
```

Open `http://localhost:4200/`. The root route redirects to `/admin/products`. The API base URL is configured in `src/environments/environment.ts` (default: `http://localhost:5000/api/v1`).

## Application structure

- `src/app/core/` — API service, catalog contracts, and shared error handling
- `src/app/shared/` — reusable UI elements (to be added as storefront features grow)
- `src/app/modules/admin/` — admin routes, shell, and product/category/brand management
- `src/app/modules/customer/` — customer storefront route placeholder

Product, category, and brand changes use the existing API. Product images and variants currently have create-only routes in the backend and are not yet exposed as complete management screens.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
