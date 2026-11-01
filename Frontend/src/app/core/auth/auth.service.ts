import { Injectable } from '@angular/core';

const STORAGE_KEY = 'cricbazar.admin.authenticated';

@Injectable({ providedIn: 'root' })
export class AuthService {
  get isAuthenticated(): boolean {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  }

  login(userId: string, password: string): boolean {
    if (userId.trim() === 'admin' && password === 'admin') {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
