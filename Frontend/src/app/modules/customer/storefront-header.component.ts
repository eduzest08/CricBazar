import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-storefront-header',
  imports: [FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './storefront-header.component.html',
  styleUrl: './storefront-header.component.scss',
})
export class StorefrontHeaderComponent {
  @Input() searchValue = '';
  @Output() readonly searchValueChange = new EventEmitter<string>();
  @Output() readonly searchSubmit = new EventEmitter<void>();
}
