import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  CustomerAccountApiService,
  CustomerAccountLoginPayload,
  RegisterCustomerAccountPayload,
} from '../../core/services/customer-account-api.service';
import { getApiErrorMessage } from '../../core/utils/api-error';
import { StorefrontFooterComponent } from './storefront-footer.component';
import { StorefrontHeaderComponent } from './storefront-header.component';

@Component({
  selector: 'app-customer-account-auth',
  imports: [FormsModule, RouterLink, StorefrontHeaderComponent, StorefrontFooterComponent],
  templateUrl: './customer-account-auth.component.html',
  styleUrl: './customer-account-auth.component.scss',
})
export class CustomerAccountAuthComponent implements OnInit, OnDestroy {
  private readonly api = inject(CustomerAccountApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private requestSubscription?: Subscription;

  readonly countries = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'United Arab Emirates'];
  mode: 'login' | 'register' = 'login';
  country = 'India';
  mobileNumber = '';
  identifier = '';
  email = '';
  firstName = '';
  lastName = '';
  password = '';
  confirmPassword = '';
  submitting = false;
  error = '';

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['accountMode'] === 'register' ? 'register' : 'login';
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
  }

  submit(form: NgForm): void {
    if (form.invalid || this.submitting) {
      form.control.markAllAsTouched();
      return;
    }

    if (this.mode === 'register' && this.password !== this.confirmPassword) {
      this.error = 'Your passwords do not match.';
      return;
    }

    this.submitting = true;
    this.error = '';
    const request = this.mode === 'register'
      ? this.api.register(this.registrationPayload())
      : this.api.login(this.loginPayload());

    this.requestSubscription?.unsubscribe();
    this.requestSubscription = request.subscribe({
      next: () => {
        this.submitting = false;
        const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
        void this.router.navigateByUrl(returnTo === '/cricket/checkout' ? returnTo : '/cricket/account/profile');
        this.changeDetector.markForCheck();
      },
      error: (error: unknown) => {
        this.submitting = false;
        this.error = getApiErrorMessage(error);
        this.changeDetector.markForCheck();
      },
    });
  }

  private registrationPayload(): RegisterCustomerAccountPayload {
    return {
      country: this.country,
      mobileNumber: this.mobileNumber.trim(),
      email: this.email.trim() || null,
      firstName: this.firstName.trim() || null,
      lastName: this.lastName.trim() || null,
      password: this.password,
    };
  }

  private loginPayload(): CustomerAccountLoginPayload {
    return {
      identifier: this.identifier.trim(),
      country: this.country,
      password: this.password,
    };
  }
}
