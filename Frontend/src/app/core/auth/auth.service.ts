import { Injectable } from '@angular/core';

const STORAGE_KEY = 'cricbazar.admin.authenticated';
const USER_ID_KEY = 'cricbazar.admin.userId';

@Injectable({ providedIn: 'root' })
export class AuthService {
  get isAuthenticated(): boolean {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  }

  get userId(): string | null {
    if (!this.isAuthenticated) {
      return null;
    }
    return sessionStorage.getItem(USER_ID_KEY) ?? 'admin';
  }

  login(userId: string, password: string): boolean {
    if (userId.trim() === 'admin' && password === 'admin') {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      sessionStorage.setItem(USER_ID_KEY, userId.trim());
      return true;
    }
    return false;
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(USER_ID_KEY);
  }
}
