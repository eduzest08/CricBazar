import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => sessionStorage.clear());

  it('records and clears the demo login ID', () => {
    expect(auth.userId).toBeNull();
    expect(auth.login(' admin ', 'admin')).toBe(true);
    expect(auth.userId).toBe('admin');
    auth.logout();
    expect(auth.userId).toBeNull();
  });

  it('recognizes existing demo sessions', () => {
    sessionStorage.setItem('cricbazar.admin.authenticated', 'true');
    expect(auth.userId).toBe('admin');
  });
});
