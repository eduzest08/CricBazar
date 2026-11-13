import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerDeliveryApiService } from '../../core/services/customer-delivery-api.service';
import { StorefrontCartService } from '../../core/services/storefront-cart.service';
import { StorefrontFooterComponent } from './storefront-footer.component';
import { StorefrontHeaderComponent } from './storefront-header.component';

type PaymentMethod = 'credit-card' | 'debit-card' | 'net-banking' | 'wallet' | 'upi';

@Component({
  selector: 'app-storefront-payment',
  imports: [CurrencyPipe, RouterLink, StorefrontHeaderComponent, StorefrontFooterComponent],
  templateUrl: './storefront-payment.component.html',
  styleUrl: './storefront-payment.component.scss',
})
export class StorefrontPaymentComponent {
  readonly cart = inject(StorefrontCartService);
  readonly savedDelivery = inject(CustomerDeliveryApiService).lastSavedDelivery;
  private readonly route = inject(ActivatedRoute);

  readonly deliveryReference = this.route.snapshot.queryParamMap.get('deliveryId');
  readonly shippingMethod = this.route.snapshot.queryParamMap.get('shipping') === 'express' ? 'express' : 'standard';
  readonly methods: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: 'credit-card', label: 'Credit Card', icon: '▰' },
    { id: 'debit-card', label: 'Debit Cards', icon: '▰' },
    { id: 'net-banking', label: 'Net Banking', icon: '▤' },
    { id: 'wallet', label: 'Wallet', icon: '▣' },
    { id: 'upi', label: 'UPI', icon: '⌁' },
  ];

  selectedMethod: PaymentMethod = 'credit-card';
  paymentNotice = '';

  get shippingFee(): number {
    return this.shippingMethod === 'express' ? 840 : 0;
  }

  get total(): number {
    return this.cart.subtotal() + this.shippingFee;
  }

  selectMethod(method: PaymentMethod): void {
    this.selectedMethod = method;
    this.paymentNotice = '';
  }

  makePayment(): void {
    this.paymentNotice = 'Online payments are not connected yet. No payment has been taken.';
  }
}
