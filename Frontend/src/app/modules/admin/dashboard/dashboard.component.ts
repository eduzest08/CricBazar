import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CatalogApiService } from '../../../core/services/catalog-api.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(CatalogApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage = '';
  productCount = 0;
  lowStockCount = 0;
  categoryCount = 0;
  brandCount = 0;

  ngOnInit(): void {
    forkJoin({
      products: this.api.getProducts('', 1, 100),
      categories: this.api.getCategories(),
      brands: this.api.getBrands(),
    }).subscribe({
      next: ({ products, categories, brands }) => {
        this.productCount = products.totalCount;
        this.lowStockCount = products.items.filter((product) => product.stock <= 5).length;
        this.categoryCount = this.countCategories(categories);
        this.brandCount = brands.length;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load dashboard data.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private countCategories(categories: { children?: unknown[] }[]): number {
    return categories.reduce(
      (total, category) =>
        total + 1 + this.countCategories((category.children ?? []) as { children?: unknown[] }[]),
      0,
    );
  }
}
