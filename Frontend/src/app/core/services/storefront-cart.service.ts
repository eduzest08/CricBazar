import { computed, Injectable, signal } from '@angular/core';
import { Product } from '../models/catalog.models';

export interface StorefrontCartItem {
  product: Product;
  quantity: number;
}

export type AddToCartResult = 'added' | 'invalid-quantity' | 'out-of-stock' | 'stock-limit';

@Injectable({ providedIn: 'root' })
export class StorefrontCartService {
  readonly items = signal<StorefrontCartItem[]>([]);
  readonly itemCount = computed(() => this.items().reduce((count, item) => count + item.quantity, 0));
  readonly subtotal = computed(() => this.items().reduce(
    (total, item) => total + item.product.salePrice * item.quantity,
    0,
  ));

  add(product: Product, quantity = 1): AddToCartResult {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) return 'invalid-quantity';
    if (product.stock <= 0) return 'out-of-stock';

    const existing = this.items().find(item => item.product.id === product.id);
    if (existing && existing.quantity + quantity > product.stock) return 'stock-limit';
    if (quantity > product.stock) return 'stock-limit';

    this.items.update(items => existing
      ? items.map(item => item.product.id === product.id
        ? { product, quantity: item.quantity + quantity }
        : item)
      : [...items, { product, quantity }]);
    return 'added';
  }

  setQuantity(productId: number, quantity: number): boolean {
    const item = this.items().find(cartItem => cartItem.product.id === productId);
    if (!item || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > item.product.stock) return false;
    this.items.update(items => items.map(cartItem => cartItem.product.id === productId
      ? { ...cartItem, quantity }
      : cartItem));
    return true;
  }

  remove(productId: number): void {
    this.items.update(items => items.filter(item => item.product.id !== productId));
  }

  clear(): void {
    this.items.set([]);
  }
}
