import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { CustomerAccountApiService } from '../../core/services/customer-account-api.service';
import { getApiErrorMessage } from '../../core/utils/api-error';
import { StorefrontFooterComponent } from './storefront-footer.component';
import { StorefrontHeaderComponent } from './storefront-header.component';

@Component({
  selector: 'app-customer-account-profile',
  imports: [RouterLink, StorefrontHeaderComponent, StorefrontFooterComponent],
  templateUrl: './customer-account-profile.component.html',
  styleUrl: './customer-account-profile.component.scss',
})
export class CustomerAccountProfileComponent implements OnInit, OnDestroy {
  readonly api = inject(CustomerAccountApiService);
  private readonly router = inject(Router);
  private requestSubscription?: Subscription;

  loading = true;
  signingOut = false;
  error = '';

  ngOnInit(): void {
    this.requestSubscription = this.api.getCurrent().subscribe({
      next: () => { this.loading = false; },
      error: (error: unknown) => {
        this.loading = false;
        this.error = getApiErrorMessage(error);
      },
    });
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
  }

  signOut(): void {
    if (this.signingOut) return;
    this.signingOut = true;
    this.requestSubscription?.unsubscribe();
    this.requestSubscription = this.api.logout().subscribe({
      next: () => void this.router.navigateByUrl('/cricket/account/login'),
      error: (error: unknown) => {
        this.signingOut = false;
        this.error = getApiErrorMessage(error);
      },
    });
  }
}
