import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-storefront-placeholder',
  imports: [RouterLink],
  template: `
    <main class="storefront">
      <a class="wordmark" routerLink="/admin/products">CRICBAZAR</a>
      <div class="coming-soon">CUSTOMER STOREFRONT</div>
      <h1>Your game. Your gear.</h1>
      <p>The customer experience is reserved for the next build phase.</p>
      <a class="back-link" routerLink="/admin/products">Return to admin catalog <span>→</span></a>
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100vh; background: #f5f7f4; }
    .storefront { display: grid; min-height: 100vh; align-content: center; justify-items: center; padding: 24px; text-align: center; }
    .wordmark { color: #173324; font-size: 13px; font-weight: 850; letter-spacing: .16em; text-decoration: none; }
    .coming-soon { margin-top: 74px; color: #6b842f; font-size: 10px; font-weight: 800; letter-spacing: .16em; }
    h1 { margin: 14px 0 10px; color: #193124; font-size: clamp(36px, 6vw, 64px); letter-spacing: -.055em; }
    p { margin: 0; color: #6c7d72; font-size: 14px; }
    .back-link { margin-top: 32px; color: #385e2f; font-size: 13px; font-weight: 700; text-decoration: none; }
    .back-link span { margin-left: 6px; }
  `,
})
export class StorefrontPlaceholderComponent {}
