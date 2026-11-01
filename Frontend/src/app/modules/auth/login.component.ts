import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  userId = '';
  password = '';
  errorMessage = '';

  signIn(): void {
    if (this.auth.login(this.userId, this.password)) {
      void this.router.navigateByUrl('/admin/dashboard');
    } else {
      this.errorMessage = 'Invalid user ID or password.';
    }
  }
}
