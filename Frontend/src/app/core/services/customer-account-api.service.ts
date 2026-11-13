import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CustomerAccount {
  customerAccountId: number;
  accountGuid: string;
  country: string;
  mobileNumber: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

export interface RegisterCustomerAccountPayload {
  country: string;
  mobileNumber: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  password: string;
}

export interface CustomerAccountLoginPayload {
  identifier: string;
  country: string;
  password: string;
}

interface AntiforgeryTokenResponse {
  requestToken: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerAccountApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/customer-accounts`;
  readonly currentAccount = signal<CustomerAccount | null>(null);
  readonly sessionChecked = signal(false);
  private sessionRequest?: Observable<CustomerAccount | null>;
  private sessionVersion = 0;

  register(payload: RegisterCustomerAccountPayload): Observable<CustomerAccount> {
    return this.withAntiforgeryToken(headers =>
      this.http.post<CustomerAccount>(`${this.endpoint}/register`, payload, {
        headers,
        withCredentials: true,
      }),
    ).pipe(tap(account => {
      this.sessionVersion++;
      this.currentAccount.set(account);
      this.sessionChecked.set(true);
    }));
  }

  login(payload: CustomerAccountLoginPayload): Observable<CustomerAccount> {
    return this.withAntiforgeryToken(headers =>
      this.http.post<CustomerAccount>(`${this.endpoint}/login`, payload, {
        headers,
        withCredentials: true,
      }),
    ).pipe(tap(account => {
      this.sessionVersion++;
      this.currentAccount.set(account);
      this.sessionChecked.set(true);
    }));
  }

  getCurrent(): Observable<CustomerAccount> {
    const version = this.sessionVersion;
    return this.http.get<CustomerAccount>(`${this.endpoint}/me`, { withCredentials: true })
      .pipe(
        tap(account => {
          if (version === this.sessionVersion) {
            this.currentAccount.set(account);
            this.sessionChecked.set(true);
          }
        }),
        catchError((error: unknown) => {
          if (version === this.sessionVersion && error instanceof HttpErrorResponse && error.status === 401) {
            this.currentAccount.set(null);
            this.sessionChecked.set(true);
          }
          return throwError(() => error);
        }),
      );
  }

  restoreSession(): Observable<CustomerAccount | null> {
    if (this.sessionChecked()) return of(this.currentAccount());
    if (!this.sessionRequest) {
      this.sessionRequest = this.getCurrent().pipe(
        catchError((error: unknown) =>
          error instanceof HttpErrorResponse && error.status === 401 ? of(null) : throwError(() => error)),
        finalize(() => { this.sessionRequest = undefined; }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.sessionRequest;
  }

  logout(): Observable<void> {
    return this.withAntiforgeryToken(headers =>
      this.http.post<void>(`${this.endpoint}/logout`, null, {
        headers,
        withCredentials: true,
      }),
    ).pipe(tap(() => {
      this.sessionVersion++;
      this.currentAccount.set(null);
      this.sessionChecked.set(true);
    }));
  }

  withAntiforgeryToken<T>(sendRequest: (headers: HttpHeaders) => Observable<T>): Observable<T> {
    return this.http.get<AntiforgeryTokenResponse>(`${this.endpoint}/antiforgery`, { withCredentials: true })
      .pipe(switchMap(response =>
        sendRequest(new HttpHeaders({ 'X-CSRF-TOKEN': response.requestToken })),
      ));
  }
}
