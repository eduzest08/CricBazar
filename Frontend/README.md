# CricBazar Frontend

Angular 22 standalone application with an admin catalog console and a customer catalog storefront. Authentication is intentionally not enabled.

## Development server

From the repository root, install frontend dependencies once:

```bash
cd Frontend
npm install
cd ..
```

Then start both the API and Angular development server with:

```bash
dotnet run --project Backend/src/CricketBazar.API
```

The development launch profile starts Angular via the SPA proxy and opens a waiting page until Angular is ready. If Angular is already running on port 4200, it is reused. Keep the API process running; stop it with Ctrl+C. Angular CLI analytics are disabled so startup does not require an interactive prompt.

Alternatively, start the frontend separately with `npm start` from `Frontend/`. If either port 5080 or 4200 is already in use by an unrelated process, stop that process or use a different configuration before starting.

If the API reports `address already in use` on port 5080, an API is already running. Stop the previous `dotnet run` with Ctrl+C in its terminal before starting it again. On macOS, `lsof -nP -iTCP:5080 -sTCP:LISTEN` identifies the process using the port.

Open `http://localhost:4200/` for the storefront home page, `http://localhost:4200/customer` for the customer catalog, or `http://localhost:4200/login` for the admin login. The previous home URL, `http://localhost:4200/customer/home`, redirects to the index. The API base URL is configured in `src/environments/environment.ts` (default: `http://localhost:5080/api/v1`).

The storefront home page displays active top-level categories, brands and best-selling products from the catalog. Category links open `/customer/category/:id`; brand links open the corresponding catalog filter. Product cards on the home and catalog pages link to `/customer/product/:id`, which displays active product details, images and specifications.

On the product details page, shipping estimates and online ordering controls are marked coming soon; cart and checkout are not yet available.

The shared storefront header offers catalog search and Home/Cricket navigation. Wishlist, customer account and cart controls are marked coming soon and are not yet functional.

The shared storefront footer links to the home page and catalog. Customer service and contact information are marked coming soon until those features and details are available.

The customer catalog shows active products with their main images and supports search, sorting, grid/list views and pagination. Its shopping options use radio buttons to open a main category page, and show counts of active products in each category and its descendants. Existing catalog links with category or brand queries continue to filter the catalog and can be cleared. The catalog loads all active products for filtering and retrieves main images for the current page; large catalogs may take longer to load. Cart, checkout and customer accounts are not yet available.

The category page shows products in the selected category and its descendants, with multi-select subcategory and brand filters and a price range. Brand options include only active brands with active products in that category or its descendants; other filters do not change these options. Removing the last selection in a filter restores all values for that filter. Clear all resets filters without leaving the category.

Product audit fields require the additive SQL migration `../Database/migrations/20261107_product_creator_user_id.sql` to be applied to the configured database before restarting the API. Existing numeric creator IDs are preserved and displayed when available. Newly created products store the demo login name separately; because login is browser-side, that name is self-reported and must not be used as a trusted security audit.

The product form calculates its read-only sale price automatically. New products start at 0% profit margin; enter a cost price above zero, then optionally change the margin or enter an MRP discount. Margin uses `cost price / (1 - margin / 100)` and discount uses `MRP × (1 - discount / 100)`. The most recently entered percentage controls the sale price when its base price changes; the other percentage reflects the resulting price. Existing products retain their price on opening and use their existing margin (or discount where margin is unavailable) when the corresponding base changes. Prices are rounded to two decimal places. A warning appears when the sale price is below cost; zero or missing denominators cannot be used for calculation.

Product details show profit or loss per item, margin, and markup below the image gallery. The viewer shows images associated with that product, including inactive products; an image that cannot be retrieved is marked unavailable and should be checked or re-uploaded.

On the Product Image page, use the product row's View icon to open its image gallery starting with the main image. The product row's Edit and Delete icons act on the main image, not the product. Expanded image rows retain their own Edit and Delete actions.

Images are grouped under expandable products, with the lowest sort order (then image ID) shown as the main image. Drag an image onto another image of the same product, or use the up/down arrows, to save its order; moving an image to the top makes it the main image. Pagination counts products and keeps their images together. Clear search and finish editing before reordering. If the images changed elsewhere, refresh and try again.

The product catalog defaults to product number (ID) descending; use the table headers to change the sort order.

The product form's category dropdown indents child categories and highlights parents in bold where the browser supports option styling; accessible option labels include the full path. Categories and their siblings follow Sort Order, then name and ID; parent and child categories can both be selected.

Use **Edit descriptions and SEO** in the product form to edit the short description, rich-text description, meta title and meta description in a popup. Closing the popup keeps changes in the draft; save the product to persist them.

Admin list row actions use icons for edit, view, delete and restore. Hover over an icon to see its action; each button also has an accessible label.

Active products can be moved to Inactive and restored later. After confirmation, permanently deleting an inactive product also removes its image records, attributes, variants, reviews, and cart and wishlist entries. Uploaded image files are retained because image URLs may be shared; external images are not affected. Products linked to order history cannot be permanently deleted. This action cannot be undone.

The category list groups children beneath their parents. Use the plus and minus buttons to expand or collapse each level. Column sorting applies to parent groups; children at every level follow Sort Order ascending, then name and ID for ties. Pagination counts top-level groups so children stay with their parent. Search shows matching categories and their ancestor path, expanded by default.

Drag a child category grip onto a sibling, or use its up/down buttons, to save their order. Main categories have no reorder controls. Reordering does not change parent categories. Clear search and finish editing before reordering. Reordering renumbers active siblings from zero and saves the complete group atomically. If the group changed elsewhere, refresh and try again.

The product page can download Excel and PDF pricing reports for all active and inactive products, independent of the current search, tab, or page. Both contain the same product and pricing columns; the PDF includes the supplied logo and table borders. Profit/loss is per item (`sale price - cost price`), and margin is that amount divided by the sale price; a negative value is a loss and margin is unavailable when the sale price is zero. Reports do not include related variants, attributes, or product images. Exports read multiple API pages, so retry if the catalog changes during an export.

The Excel report contains one row per product, without padding. Worksheet gridlines are hidden to keep unused rows visually blank; the rows remain available for editing and gridlines can be re-enabled in Excel's View settings.

Use the Display color buttons in the admin header to switch between Forest, Ocean, Plum, and Slate themes. The selection is saved in browser local storage and applies to the admin workspace.

## Application structure

- `src/app/core/` — API service, catalog contracts, and shared error handling
- `src/app/shared/` — reusable UI elements (to be added as storefront features grow)
- `src/app/modules/admin/` — admin routes, shell, and product/category/brand management
- `src/app/modules/customer/` — customer catalog storefront

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
