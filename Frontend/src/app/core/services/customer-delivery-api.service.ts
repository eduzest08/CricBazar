import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomerAccountApiService } from './customer-account-api.service';

export interface CustomerDeliveryDetailsPayload {
  customerCountry: string;
  mobileNumber: string;
  orderEmail: string | null;
  firstName: string;
  lastName: string | null;
  addressLine1: string;
  addressLine2: string | null;
  receiverPhone: string;
  pincode: string;
  state: string;
  city: string;
  deliveryCountry: string;
}

export interface CustomerDeliveryDetailsResponse {
  customerDeliveryId: number;
  message: string;
}

export interface CustomerSavedAddress extends CustomerDeliveryDetailsPayload {
  customerDeliveryId: number;
}

export interface SavedCustomerDeliveryDetails {
  customerDeliveryId: number;
  details: CustomerDeliveryDetailsPayload;
}

@Injectable({ providedIn: 'root' })
export class CustomerDeliveryApiService {
  private readonly http = inject(HttpClient);
  private readonly accountApi = inject(CustomerAccountApiService);
  private readonly savedDelivery = signal<(SavedCustomerDeliveryDetails & { accountId: number | null }) | null>(null);
  readonly lastSavedDelivery = computed(() => {
    const saved = this.savedDelivery();
    return this.accountApi.sessionChecked() &&
      saved?.accountId === (this.accountApi.currentAccount()?.customerAccountId ?? null)
      ? saved : null;
  });

  remember(details: CustomerDeliveryDetailsPayload, customerDeliveryId: number): void {
    this.savedDelivery.set({
      customerDeliveryId, details, accountId: this.accountApi.currentAccount()?.customerAccountId ?? null,
    });
  }

  forget(customerDeliveryId: number): void {
    if (this.lastSavedDelivery()?.customerDeliveryId === customerDeliveryId) {
      this.savedDelivery.set(null);
    }
  }

  save(payload: CustomerDeliveryDetailsPayload): Observable<CustomerDeliveryDetailsResponse> {
    const saveToAccount = this.accountApi.currentAccount() !== null;
    return this.accountApi.withAntiforgeryToken(headers =>
      this.http.post<CustomerDeliveryDetailsResponse>(
        `${environment.apiBaseUrl}/customer-delivery-details`,
        { ...payload, saveToAccount },
        { headers, withCredentials: true },
      ),
    );
  }

  getLatest(): Observable<CustomerDeliveryDetailsPayload | null> {
    return this.http.get<CustomerDeliveryDetailsPayload | null>(
      `${environment.apiBaseUrl}/customer-delivery-details/latest`,
      { withCredentials: true },
    );
  }

  getSavedAddresses(): Observable<CustomerSavedAddress[]> {
    return this.http.get<CustomerSavedAddress[]>(
      `${environment.apiBaseUrl}/customer-delivery-details`,
      { withCredentials: true },
    );
  }

  update(customerDeliveryId: number, payload: CustomerDeliveryDetailsPayload): Observable<CustomerDeliveryDetailsResponse> {
    return this.accountApi.withAntiforgeryToken(headers =>
      this.http.put<CustomerDeliveryDetailsResponse>(
        `${environment.apiBaseUrl}/customer-delivery-details/${customerDeliveryId}`,
        payload,
        { headers, withCredentials: true },
      ),
    );
  }

  remove(customerDeliveryId: number): Observable<void> {
    return this.accountApi.withAntiforgeryToken(headers =>
      this.http.delete<void>(`${environment.apiBaseUrl}/customer-delivery-details/${customerDeliveryId}`,
        { headers, withCredentials: true }),
    );
  }
}
