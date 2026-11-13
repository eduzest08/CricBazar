import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { CustomerAccount, CustomerAccountApiService } from '../../core/services/customer-account-api.service';
import { CustomerAccountAuthComponent } from './customer-account-auth.component';

@Component({ template: 'Checkout destination' })
class CheckoutDestinationComponent {}

describe('checkout sign-in return', () => {
  it('preserves the checkout destination through registration and sign-in', async () => {
    const account: CustomerAccount = {
      customerAccountId: 1, accountGuid: 'id', country: 'India', mobileNumber: '1234567890',
      email: null, firstName: 'Fan', lastName: null, createdAt: '2026-01-01',
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'cricket/account/login', component: CustomerAccountAuthComponent, data: { accountMode: 'login' } },
          { path: 'cricket/account/register', component: CustomerAccountAuthComponent, data: { accountMode: 'register' } },
          { path: 'cricket/checkout', component: CheckoutDestinationComponent },
        ]),
        { provide: CatalogApiService, useValue: { getCategories: () => of([]) } },
        { provide: CustomerAccountApiService, useValue: {
          currentAccount: signal<CustomerAccount | null>(null),
          sessionChecked: signal(true),
          restoreSession: () => of(null),
          login: () => of(account),
        } },
      ],
    });

    const harness = await RouterTestingHarness.create('/cricket/account/login?returnTo=%2Fcricket%2Fcheckout');
    let element = harness.routeNativeElement as HTMLElement;
    expect(element.querySelector<HTMLAnchorElement>('.account-switch a')?.getAttribute('href'))
      .toContain('returnTo=');
    element.querySelector<HTMLAnchorElement>('.account-switch a')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(Router).url).toContain('/cricket/account/register?returnTo=');
    element = harness.routeNativeElement as HTMLElement;
    element.querySelector<HTMLAnchorElement>('.account-switch a')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    element = harness.routeNativeElement as HTMLElement;
    const identifier = element.querySelector<HTMLInputElement>('input[name=identifier]')!;
    const password = element.querySelector<HTMLInputElement>('input[name=password]')!;
    identifier.value = '1234567890';
    identifier.dispatchEvent(new Event('input'));
    password.value = 'ExamplePassword123';
    password.dispatchEvent(new Event('input'));
    harness.detectChanges();
    await harness.fixture.whenStable();
    element.querySelector<HTMLFormElement>('form:not(.search)')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/cricket/checkout');
  });
});
