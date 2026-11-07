import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-storefront-footer',
  imports: [RouterLink],
  templateUrl: './storefront-footer.component.html',
  styleUrl: './storefront-footer.component.scss',
})
export class StorefrontFooterComponent {
  private readonly document = inject(DOCUMENT);
  readonly year = new Date().getFullYear();

  backToTop(): void {
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
