import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CustomerDeliveryApiService, CustomerDeliveryDetailsPayload } from './customer-delivery-api.service';
import { CustomerAccountApiService } from './customer-account-api.service';

describe('customer delivery API', () => {
  const address: CustomerDeliveryDetailsPayload = {
    customerCountry: 'India', mobileNumber: '1234567890', orderEmail: null, firstName: 'Fan',
    lastName: null, addressLine1: 'Test Street', addressLine2: null, receiverPhone: '1234567890',
    pincode: '560001', state: 'Karnataka', city: 'Bengaluru', deliveryCountry: 'India',
  };
  let api: CustomerDeliveryApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(CustomerDeliveryApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('sends the session and antiforgery token when saving an address', () => {
    api.save(address).subscribe();
    const token = http.expectOne('http://localhost:5080/api/v1/customer-accounts/antiforgery');
    expect(token.request.withCredentials).toBe(true);
    token.flush({ requestToken: 'token' });
    const save = http.expectOne('http://localhost:5080/api/v1/customer-delivery-details');
    expect(save.request.withCredentials).toBe(true);
    expect(save.request.headers.get('X-CSRF-TOKEN')).toBe('token');
    expect(save.request.body).toEqual({ ...address, saveToAccount: false });
    save.flush({ customerDeliveryId: 1, message: 'Saved' });
  });

  it('requests the latest address with the session cookie', () => {
    api.getLatest().subscribe(result => expect(result).toEqual(address));
    const request = http.expectOne('http://localhost:5080/api/v1/customer-delivery-details/latest');
    expect(request.request.withCredentials).toBe(true);
    request.flush(address);
  });

  it('requests all saved addresses with the session cookie', () => {
    const saved = [{ ...address, customerDeliveryId: 7 }];
    api.getSavedAddresses().subscribe(result => expect(result).toEqual(saved));
    const request = http.expectOne('http://localhost:5080/api/v1/customer-delivery-details');
    expect(request.request.withCredentials).toBe(true);
    request.flush(saved);
  });

  it('requires an authenticated account when saving from a signed-in checkout', () => {
    const account = TestBed.inject(CustomerAccountApiService);
    account.currentAccount.set({
      customerAccountId: 1, accountGuid: 'id', country: 'India', mobileNumber: '1234567890',
      email: null, firstName: 'Fan', lastName: null, createdAt: '2026-01-01',
    });

    api.save(address).subscribe();
    http.expectOne('http://localhost:5080/api/v1/customer-accounts/antiforgery').flush({ requestToken: 'token' });
    const request = http.expectOne('http://localhost:5080/api/v1/customer-delivery-details');
    expect(request.request.body.saveToAccount).toBe(true);
    request.flush({ customerDeliveryId: 1, message: 'Saved' });
  });

  it('updates and removes an address with credentials and antiforgery protection', () => {
    api.update(7, address).subscribe();
    http.expectOne('http://localhost:5080/api/v1/customer-accounts/antiforgery').flush({ requestToken: 'token' });
    const update = http.expectOne('http://localhost:5080/api/v1/customer-delivery-details/7');
    expect(update.request.method).toBe('PUT');
    expect(update.request.withCredentials).toBe(true);
    expect(update.request.headers.get('X-CSRF-TOKEN')).toBe('token');
    expect(update.request.body).toEqual(address);
    update.flush({ customerDeliveryId: 7, message: 'Updated' });

    api.remove(7).subscribe();
    http.expectOne('http://localhost:5080/api/v1/customer-accounts/antiforgery').flush({ requestToken: 'token2' });
    const remove = http.expectOne('http://localhost:5080/api/v1/customer-delivery-details/7');
    expect(remove.request.method).toBe('DELETE');
    expect(remove.request.withCredentials).toBe(true);
    expect(remove.request.headers.get('X-CSRF-TOKEN')).toBe('token2');
    remove.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('does not show a previous account delivery after signing out', () => {
    const account = TestBed.inject(CustomerAccountApiService);
    account.sessionChecked.set(true);
    account.currentAccount.set({
      customerAccountId: 1, accountGuid: 'id', country: 'India', mobileNumber: '1234567890',
      email: null, firstName: 'Fan', lastName: null, createdAt: '2026-01-01',
    });
    api.remember(address, 1);
    expect(api.lastSavedDelivery()?.details).toEqual(address);
    account.currentAccount.set(null);
    expect(api.lastSavedDelivery()).toBeNull();
  });
});
