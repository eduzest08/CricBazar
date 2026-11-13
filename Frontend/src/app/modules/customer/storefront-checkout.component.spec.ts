import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CustomerAccount, CustomerAccountApiService } from '../../core/services/customer-account-api.service';
import { CustomerDeliveryApiService, CustomerDeliveryDetailsPayload } from '../../core/services/customer-delivery-api.service';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { StorefrontCartService } from '../../core/services/storefront-cart.service';
import { StorefrontCheckoutComponent } from './storefront-checkout.component';

describe('checkout account selection', () => {
  const customer: CustomerAccount = {
    customerAccountId: 1, accountGuid: 'id', country: 'India', mobileNumber: '1234567890',
    email: 'fan@example.com', firstName: 'Fan', lastName: null, createdAt: '2026-01-01',
  };
  const address: CustomerDeliveryDetailsPayload = {
    customerCountry: 'India', mobileNumber: '1234567890', orderEmail: 'fan@example.com',
    firstName: 'Fan', lastName: null, addressLine1: 'Test Street', addressLine2: null,
    receiverPhone: '1234567890', pincode: '560001', state: 'Karnataka', city: 'Bengaluru',
    deliveryCountry: 'India',
  };
  let account: { currentAccount: ReturnType<typeof signal<CustomerAccount | null>>; sessionChecked: ReturnType<typeof signal<boolean>>; restoreSession: ReturnType<typeof vi.fn> };
  let delivery: { getSavedAddresses: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn>; remember: ReturnType<typeof vi.fn>; forget: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    account = { currentAccount: signal<CustomerAccount | null>(null), sessionChecked: signal(true), restoreSession: vi.fn(() => of(null)) };
    delivery = {
      getSavedAddresses: vi.fn(() => of([{ ...address, customerDeliveryId: 1 }])),
      save: vi.fn(() => of({ customerDeliveryId: 3, message: 'Saved' })),
      update: vi.fn(() => of({ customerDeliveryId: 1, message: 'Delivery details updated' })),
      remove: vi.fn(() => of(void 0)),
      remember: vi.fn(),
      forget: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [StorefrontCheckoutComponent],
      providers: [
        provideRouter([]),
        { provide: CustomerAccountApiService, useValue: account },
        { provide: CustomerDeliveryApiService, useValue: delivery },
        { provide: CatalogApiService, useValue: { getCategories: () => of([]) } },
        { provide: StorefrontCartService, useValue: { items: () => [{ product: { id: 1, name: 'Bat', salePrice: 100 }, quantity: 1 }], subtotal: () => 100, itemCount: () => 1 } },
      ],
    });
  });

  it('asks signed-out customers to choose and allows guest checkout', () => {
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('How would you like to checkout?');
    expect(element.querySelector<HTMLAnchorElement>('.checkout-choice a')?.getAttribute('href')).toContain('returnTo');
    element.querySelector<HTMLButtonElement>('.checkout-choice button')!.click();
    fixture.detectChanges();
    expect(element.querySelector('#address-line-1')).not.toBeNull();
    expect(delivery.getSavedAddresses).not.toHaveBeenCalled();
  });

  it('prefills account contact details when no address is saved', () => {
    account.currentAccount.set(customer);
    delivery.getSavedAddresses.mockReturnValue(of([]));
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.delivery.firstName).toBe('Fan');
    expect(fixture.componentInstance.delivery.mobileNumber).toBe('1234567890');
    expect(fixture.componentInstance.delivery.addressLine1).toBe('');
  });

  it('loads the signed-in customer address and clears it on sign out', () => {
    account.currentAccount.set(customer);
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.delivery.addressLine1).toBe('Test Street');
    expect(fixture.nativeElement.textContent).toContain('Choose a delivery address');
    account.currentAccount.set(null);
    fixture.detectChanges();
    expect(fixture.componentInstance.delivery.addressLine1).toBe('');
    expect(fixture.nativeElement.textContent).toContain('How would you like to checkout?');
  });

  it('reports address load failures instead of claiming no address exists', () => {
    account.currentAccount.set(customer);
    delivery.getSavedAddresses.mockReturnValue(throwError(() => new Error('Database unavailable')));
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Database unavailable');
  });

  it('lets customers choose between saved addresses or add a new address', () => {
    account.currentAccount.set(customer);
    delivery.getSavedAddresses.mockReturnValue(of([
      { ...address, customerDeliveryId: 2, addressLine1: 'Second Street', city: 'Mysuru' },
      { ...address, customerDeliveryId: 1 },
    ]));
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.saved-address input')).toHaveLength(3);
    expect(fixture.componentInstance.delivery.addressLine1).toBe('Second Street');
    element.querySelectorAll<HTMLInputElement>('.saved-address input')[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.delivery.addressLine1).toBe('Test Street');
    expect(fixture.componentInstance.selectedAddressId).toBe(1);
    element.querySelectorAll<HTMLInputElement>('.saved-address input')[2].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedAddressId).toBeNull();
    expect(fixture.componentInstance.delivery.addressLine1).toBe('');
    expect(fixture.componentInstance.delivery.firstName).toBe('Fan');
  });

  it('reuses an unchanged selected address without saving a duplicate', async () => {
    account.currentAccount.set(customer);
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLFormElement>('form:not(.search)')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(delivery.update).toHaveBeenCalledWith(1, address);
    expect(delivery.save).not.toHaveBeenCalled();
    expect(delivery.remember).toHaveBeenCalledWith(address, 1);
    expect(element.textContent).toContain('Delivery details updated');
    element.querySelector<HTMLInputElement>('#address-line-1')!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(element.querySelector('.payment-link')).toBeNull();
  });

  it('updates the selected address without creating a new choice', async () => {
    account.currentAccount.set(customer);
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('#address-line-1')!;
    input.value = 'New Street';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    element.querySelector<HTMLFormElement>('form:not(.search)')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(delivery.update).toHaveBeenCalledWith(1, expect.objectContaining({ addressLine1: 'New Street' }));
    expect(delivery.save).not.toHaveBeenCalled();
    expect(fixture.componentInstance.selectedAddressId).toBe(1);
    expect(fixture.componentInstance.savedAddresses).toHaveLength(1);
    expect(fixture.componentInstance.savedAddresses[0].addressLine1).toBe('New Street');
  });

  it('saves a newly entered address and makes it selectable', async () => {
    account.currentAccount.set(customer);
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelectorAll<HTMLInputElement>('.saved-address input')[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    const values: Record<string, string> = {
      'address-line-1': 'Third Street', 'receiver-phone': '1234567890',
      pincode: '560001', state: 'Karnataka', city: 'Bengaluru',
    };
    for (const [id, value] of Object.entries(values)) {
      const input = element.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    fixture.detectChanges();
    await fixture.whenStable();
    element.querySelector<HTMLFormElement>('form:not(.search)')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(delivery.save).toHaveBeenCalledWith(expect.objectContaining({ addressLine1: 'Third Street' }));
    expect(fixture.componentInstance.selectedAddressId).toBe(3);
    expect(element.querySelectorAll('.saved-address input')).toHaveLength(3);
    expect(element.textContent).toContain('Third Street');
  });

  it('does not continue if a selected saved address is no longer available', async () => {
    account.currentAccount.set(customer);
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    delivery.update.mockReturnValue(throwError(() => new Error('Address not found')));
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLFormElement>('form:not(.search)')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(element.textContent).toContain('Address not found');
    expect(delivery.save).not.toHaveBeenCalled();
    expect(delivery.remember).not.toHaveBeenCalled();
  });

  it('confirms removal and selects another address when the selected address is removed', () => {
    account.currentAccount.set(customer);
    delivery.getSavedAddresses.mockReturnValue(of([
      { ...address, customerDeliveryId: 2, addressLine1: 'Second Street' },
      { ...address, customerDeliveryId: 1 },
    ]));
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.saved-address-card .remove-address')!.click();
    fixture.detectChanges();
    expect(delivery.remove).not.toHaveBeenCalled();
    element.querySelector<HTMLButtonElement>('.remove-address-confirm .remove-address')!.click();
    fixture.detectChanges();
    expect(delivery.remove).toHaveBeenCalledWith(2);
    expect(delivery.forget).toHaveBeenCalledWith(2);
    expect(fixture.componentInstance.selectedAddressId).toBe(1);
    expect(fixture.componentInstance.delivery.addressLine1).toBe('Test Street');
    expect(fixture.componentInstance.savedAddresses).toHaveLength(1);
  });

  it('keeps the selection and shows an error when removal fails', () => {
    account.currentAccount.set(customer);
    delivery.remove.mockReturnValue(throwError(() => new Error('Removal failed')));
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.saved-address-card .remove-address')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.remove-address-confirm .remove-address')!.click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Removal failed');
    expect(fixture.componentInstance.selectedAddressId).toBe(1);
    expect(fixture.componentInstance.savedAddresses).toHaveLength(1);
  });

  it('can cancel removal or remove an unselected address without changing the form', () => {
    account.currentAccount.set(customer);
    delivery.getSavedAddresses.mockReturnValue(of([
      { ...address, customerDeliveryId: 2, addressLine1: 'Second Street' },
      { ...address, customerDeliveryId: 1 },
    ]));
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelectorAll<HTMLButtonElement>('.saved-address-card > .remove-address')[1].click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.remove-address-confirm button:not(.remove-address)')!.click();
    fixture.detectChanges();
    expect(delivery.remove).not.toHaveBeenCalled();
    element.querySelectorAll<HTMLButtonElement>('.saved-address-card > .remove-address')[1].click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.remove-address-confirm .remove-address')!.click();
    fixture.detectChanges();
    expect(delivery.remove).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.selectedAddressId).toBe(2);
    expect(fixture.componentInstance.delivery.addressLine1).toBe('Second Street');
  });

  it('clears the form when the last saved address is removed', () => {
    account.currentAccount.set(customer);
    const fixture = TestBed.createComponent(StorefrontCheckoutComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.saved-address-card .remove-address')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.remove-address-confirm .remove-address')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedAddressId).toBeNull();
    expect(fixture.componentInstance.delivery.addressLine1).toBe('');
    expect(element.querySelector('.saved-addresses')).toBeNull();
  });
});
