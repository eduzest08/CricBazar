import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './core/services/loading.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: `
    @if (loading.active()) {
      <div class="global-loader" role="status" aria-label="Loading"></div>
    }
    <router-outlet />
  `,
})
export class App {
  readonly loading = inject(LoadingService);
}
