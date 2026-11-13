import { CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, effect, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  CustomerDeliveryApiService,
  CustomerDeliveryDetailsPayload,
  CustomerSavedAddress,
} from '../../core/services/customer-delivery-api.service';
import { StorefrontCartService } from '../../core/services/storefront-cart.service';
import { CustomerAccountApiService } from '../../core/services/customer-account-api.service';
import { getApiErrorMessage } from '../../core/utils/api-error';
import { StorefrontFooterComponent } from './storefront-footer.component';
import { StorefrontHeaderComponent } from './storefront-header.component';

@Component({
  selector: 'app-storefront-checkout',
  imports: [CurrencyPipe, FormsModule, RouterLink, StorefrontHeaderComponent, StorefrontFooterComponent],
  templateUrl: './storefront-checkout.component.html',
  styleUrl: './storefront-checkout.component.scss',
})
export class StorefrontCheckoutComponent implements OnDestroy {
  readonly cart = inject(StorefrontCartService);
  private readonly api = inject(CustomerDeliveryApiService);
  readonly account = inject(CustomerAccountApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private saveSubscription?: Subscription;
  private sessionSubscription?: Subscription;
  private addressSubscription?: Subscription;
  private removeSubscription?: Subscription;

  readonly countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'United Arab Emirates'];
  readonly delivery: CustomerDeliveryDetailsPayload = {
    customerCountry: 'India',
    mobileNumber: '',
    orderEmail: null,
    firstName: '',
    lastName: null,
    addressLine1: '',
    addressLine2: null,
    receiverPhone: '',
    pincode: '',
    state: '',
    city: '',
    deliveryCountry: 'India',
  };

  shippingMethod: 'standard' | 'express' = 'standard';
  saving = false;
  validationError = false;
  error = '';
  confirmation = '';
  savedDeliveryId: number | null = null;
  guestChosen = false;
  loadingAddress = false;
  sessionError = '';
  addressError = '';
  savedAddresses: CustomerSavedAddress[] = [];
  selectedAddressId: number | null = null;
  removing = false;
  pendingRemovalId: number | null = null;
  removeError = '';

  constructor() {
    effect(() => {
      if (!this.account.sessionChecked()) return;
      const customer = this.account.currentAccount();
      this.addressSubscription?.unsubscribe();
      this.saveSubscription?.unsubscribe();
      this.removeSubscription?.unsubscribe();
      this.saving = false;
      this.removing = false;
      this.pendingRemovalId = null;
      this.removeError = '';
      this.guestChosen = false;
      this.savedAddresses = [];
      this.selectedAddressId = null;
      this.addressError = '';
      this.confirmation = '';
      this.savedDeliveryId = null;
      Object.assign(this.delivery, {
        customerCountry: 'India', mobileNumber: '', orderEmail: null, firstName: '',
        lastName: null, addressLine1: '', addressLine2: null, receiverPhone: '',
        pincode: '', state: '', city: '', deliveryCountry: 'India',
      });
      if (!customer) {
        this.loadingAddress = false;
        return;
      }
      this.loadingAddress = true;
      this.addressSubscription = this.api.getSavedAddresses().subscribe({
        next: addresses => {
          this.savedAddresses = addresses;
          if (addresses.length) {
            this.selectAddress(addresses[0]);
          } else {
            Object.assign(this.delivery, {
              customerCountry: customer.country, mobileNumber: customer.mobileNumber,
              orderEmail: customer.email, firstName: customer.firstName ?? '', lastName: customer.lastName,
            });
          }
          this.loadingAddress = false;
          this.changeDetector.markForCheck();
        },
        error: (error: unknown) => {
          this.loadingAddress = false;
          this.addressError = getApiErrorMessage(error);
          this.changeDetector.markForCheck();
        },
      });
    });
    this.restoreSession();
  }

  selectAddress(address: CustomerSavedAddress): void {
    const { customerDeliveryId, ...details } = address;
    this.selectedAddressId = customerDeliveryId;
    Object.assign(this.delivery, details);
    this.clearConfirmation();
  }

  removeAddress(customerDeliveryId: number): void {
    if (this.removing || this.saving) return;
    this.removing = true;
    this.removeError = '';
    this.removeSubscription = this.api.remove(customerDeliveryId).subscribe({
      next: () => {
        this.removing = false;
        this.pendingRemovalId = null;
        this.savedAddresses = this.savedAddresses.filter(address => address.customerDeliveryId !== customerDeliveryId);
        this.api.forget(customerDeliveryId);
        if (this.selectedAddressId === customerDeliveryId) {
          if (this.savedAddresses.length) this.selectAddress(this.savedAddresses[0]);
          else this.addNewAddress();
        } else if (this.savedDeliveryId === customerDeliveryId) {
          this.clearConfirmation();
        }
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.removing = false;
        this.removeError = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  addNewAddress(): void {
    const customer = this.account.currentAccount();
    this.selectedAddressId = null;
    Object.assign(this.delivery, {
      customerCountry: customer?.country ?? 'India', mobileNumber: customer?.mobileNumber ?? '',
      orderEmail: customer?.email ?? null, firstName: customer?.firstName ?? '',
      lastName: customer?.lastName ?? null, addressLine1: '', addressLine2: null,
      receiverPhone: '', pincode: '', state: '', city: '', deliveryCountry: 'India',
    });
    this.clearConfirmation();
  }

  clearConfirmation(): void {
    this.confirmation = '';
    this.savedDeliveryId = null;
  }

  restoreSession(): void {
    this.sessionError = '';
    this.sessionSubscription?.unsubscribe();
    this.sessionSubscription = this.account.restoreSession().subscribe({
      error: (error: unknown) => {
        this.sessionError = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  get shippingFee(): number {
    return this.shippingMethod === 'express' ? 840 : 0;
  }

  get total(): number {
    return this.cart.subtotal() + this.shippingFee;
  }

  ngOnDestroy(): void {
    this.saveSubscription?.unsubscribe();
    this.sessionSubscription?.unsubscribe();
    this.addressSubscription?.unsubscribe();
    this.removeSubscription?.unsubscribe();
  }

  saveDeliveryDetails(form: NgForm): void {
    if (form.invalid || !this.cart.items().length || this.saving || this.removing || this.loadingAddress ||
      !this.account.sessionChecked() || (!this.account.currentAccount() && !this.guestChosen)) {
      form.control.markAllAsTouched();
      this.validationError = !!form.invalid;
      return;
    }

    this.saveSubscription?.unsubscribe();
    this.validationError = false;
    this.saving = true;
    this.error = '';
    this.confirmation = '';
    const payload: CustomerDeliveryDetailsPayload = {
      ...this.delivery,
      mobileNumber: this.delivery.mobileNumber.trim(),
      orderEmail: this.delivery.orderEmail?.trim() || null,
      firstName: this.delivery.firstName.trim(),
      lastName: this.delivery.lastName?.trim() || null,
      addressLine1: this.delivery.addressLine1.trim(),
      addressLine2: this.delivery.addressLine2?.trim() || null,
      receiverPhone: this.delivery.receiverPhone.trim(),
      pincode: this.delivery.pincode.trim(),
      state: this.delivery.state.trim(),
      city: this.delivery.city.trim(),
    };

    const selectedId = this.selectedAddressId;
    const request = selectedId === null ? this.api.save(payload) : this.api.update(selectedId, payload);

    this.saveSubscription = request.subscribe({
      next: response => {
        this.saving = false;
        this.savedDeliveryId = response.customerDeliveryId;
        if (this.account.currentAccount()) {
          const updated = { ...payload, customerDeliveryId: response.customerDeliveryId };
          this.savedAddresses = selectedId === null
            ? [updated, ...this.savedAddresses]
            : this.savedAddresses.map(address => address.customerDeliveryId === selectedId ? updated : address);
          this.selectedAddressId = response.customerDeliveryId;
        }
        this.api.remember(payload, response.customerDeliveryId);
        this.confirmation = `${response.message} Reference: ${response.customerDeliveryId}.`;
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.saving = false;
        this.error = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }
}
