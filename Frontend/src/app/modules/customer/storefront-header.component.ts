import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subscription } from 'rxjs';
import { Category } from '../../core/models/catalog.models';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { StorefrontCartService } from '../../core/services/storefront-cart.service';
import { getApiErrorMessage } from '../../core/utils/api-error';

interface CategoryMenuGroup {
  category: Category;
  subcategories: { category: Category; depth: number }[];
}

@Component({
  selector: 'app-storefront-header',
  imports: [CurrencyPipe, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './storefront-header.component.html',
  styleUrl: './storefront-header.component.scss',
})
export class StorefrontHeaderComponent implements OnInit, OnDestroy {
  private readonly api = inject(CatalogApiService);
  readonly cart = inject(StorefrontCartService);
  private categorySubscription?: Subscription;
  @ViewChild('cricketMenu', { read: ElementRef }) private cricketMenuElement?: ElementRef<HTMLElement>;

  @Input() searchValue = '';
  @Output() readonly searchValueChange = new EventEmitter<string>();
  @Output() readonly searchSubmit = new EventEmitter<void>();

  categoryMenuOpen = false;
  cartOpen = false;
  categoryMenuLoading = true;
  categoryMenuError = '';
  categoryGroups: CategoryMenuGroup[] = [];

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.categorySubscription?.unsubscribe();
  }

  toggleCategoryMenu(): void {
    this.categoryMenuOpen = !this.categoryMenuOpen;
  }

  closeCategoryMenu(): void {
    this.categoryMenuOpen = false;
  }

  toggleCart(): void {
    this.cartOpen = !this.cartOpen;
  }

  changeCartQuantity(productId: number, quantity: number): void {
    this.cart.setQuantity(productId, quantity);
  }

  @HostListener('document:click', ['$event'])
  closeCategoryMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target;
    if (this.categoryMenuOpen && target instanceof Node &&
      !this.cricketMenuElement?.nativeElement.contains(target)) {
      this.closeCategoryMenu();
    }
  }

  @HostListener('document:keydown.escape')
  closeCategoryMenuOnEscape(): void {
    this.closeCategoryMenu();
  }

  loadCategories(): void {
    this.categorySubscription?.unsubscribe();
    this.categoryMenuLoading = true;
    this.categoryMenuError = '';
    this.categorySubscription = this.api.getCategories().subscribe({
      next: categories => {
        const byId = new Map<number, Category>();
        const collect = (items: Category[]): void => {
          for (const category of items) {
            if (byId.has(category.id)) continue;
            byId.set(category.id, category);
            collect(category.children ?? []);
          }
        };
        collect(categories);

        const childrenByParent = new Map<number, Category[]>();
        for (const category of byId.values()) {
          if (category.parentId === null) continue;
          const children = childrenByParent.get(category.parentId) ?? [];
          children.push(category);
          childrenByParent.set(category.parentId, children);
        }
        const sort = (items: Category[]): Category[] =>
          items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name) || a.id - b.id);
        const descendants = (parentId: number, depth: number, ancestors: Set<number>): { category: Category; depth: number }[] =>
          sort((childrenByParent.get(parentId) ?? []).filter(category => category.isActive))
            .flatMap(category => {
              if (ancestors.has(category.id)) return [];
              const nextAncestors = new Set(ancestors).add(category.id);
              return [
                { category, depth },
                ...descendants(category.id, depth + 1, nextAncestors),
              ];
            });

        this.categoryGroups = sort([...byId.values()].filter(category => category.parentId === null && category.isActive))
          .map(category => ({
            category,
            subcategories: descendants(category.id, 0, new Set([category.id])),
          }));
        this.categoryMenuLoading = false;
      },
      error: (error: unknown) => {
        this.categoryMenuLoading = false;
        this.categoryMenuError = getApiErrorMessage(error);
      },
    });
  }
}
