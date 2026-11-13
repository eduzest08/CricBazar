import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CustomerAccount, CustomerAccountApiService } from './customer-account-api.service';

describe('customer account API', () => {
  let api: CustomerAccountApiService;
  let http: HttpTestingController;

  const account: CustomerAccount = {
    customerAccountId: 21,
    accountGuid: 'ac8cb82a-211e-4e51-95be-61d3452f5308',
    country: 'India',
    mobileNumber: '9876543210',
    email: 'fan@example.com',
    firstName: 'Cricket',
    lastName: 'Fan',
    createdAt: '2026-11-13T10:00:00Z',
  };
  const endpoint = 'http://localhost:5080/api/v1/customer-accounts';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CustomerAccountApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches an anti-forgery token and posts registration with credentials', () => {
    let response: CustomerAccount | undefined;
    api.register({
      country: 'India',
      mobileNumber: '9876543210',
      email: 'fan@example.com',
      firstName: 'Cricket',
      lastName: 'Fan',
      password: 'SafePassword123',
    }).subscribe(value => response = value);

    const tokenRequest = http.expectOne(`${endpoint}/antiforgery`);
    expect(tokenRequest.request.withCredentials).toBe(true);
    tokenRequest.flush({ requestToken: 'request-token' });

    const registerRequest = http.expectOne(`${endpoint}/register`);
    expect(registerRequest.request.method).toBe('POST');
    expect(registerRequest.request.withCredentials).toBe(true);
    expect(registerRequest.request.headers.get('X-CSRF-TOKEN')).toBe('request-token');
    registerRequest.flush(account);

    expect(response).toEqual(account);
    expect(api.currentAccount()).toEqual(account);
  });

  it('clears stale customer state when the session is unauthorized', () => {
    api.currentAccount.set(account);
    let failed = false;
    api.getCurrent().subscribe({ error: () => failed = true });
    http.expectOne(`${endpoint}/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(failed).toBe(true);
    expect(api.currentAccount()).toBeNull();
  });

  it('shares session restoration and treats an unauthorized session as signed out', () => {
    let responses = 0;
    api.restoreSession().subscribe(value => { expect(value).toBeNull(); responses++; });
    api.restoreSession().subscribe(value => { expect(value).toBeNull(); responses++; });
    http.expectOne(`${endpoint}/me`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(responses).toBe(2);
    expect(api.sessionChecked()).toBe(true);
    api.restoreSession().subscribe(value => expect(value).toBeNull());
    http.expectNone(`${endpoint}/me`);
  });

  it('reports a session check failure rather than treating it as a guest', () => {
    let failed = false;
    api.restoreSession().subscribe({ error: () => failed = true });
    http.expectOne(`${endpoint}/me`).flush({}, { status: 500, statusText: 'Error' });
    expect(failed).toBe(true);
    expect(api.sessionChecked()).toBe(false);
  });

  it('does not let a stale session check overwrite a successful login', () => {
    api.restoreSession().subscribe();
    const oldSession = http.expectOne(`${endpoint}/me`);
    api.login({ identifier: 'fan@example.com', country: 'India', password: 'SafePassword123' }).subscribe();
    http.expectOne(`${endpoint}/antiforgery`).flush({ requestToken: 'token' });
    http.expectOne(`${endpoint}/login`).flush(account);
    oldSession.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(api.currentAccount()).toEqual(account);
  });
});
