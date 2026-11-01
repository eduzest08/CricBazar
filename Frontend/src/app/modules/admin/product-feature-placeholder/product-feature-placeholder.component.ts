import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-product-feature-placeholder',
  templateUrl: './product-feature-placeholder.component.html',
  styleUrl: './product-feature-placeholder.component.scss',
})
export class ProductFeaturePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly pageTitle = this.route.snapshot.data['pageTitle'] as string;
  readonly description = this.route.snapshot.data['description'] as string;
  readonly placeholderTitle = this.route.snapshot.data['placeholderTitle'] as string;
}
