import { Component, input } from '@angular/core';

@Component({
  selector: 'app-action-icon',
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (name()) {
        @case ('edit') {
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
        }
        @case ('delete') {
          <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
        }
        @case ('view') {
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        }
        @case ('restore') {
          <path d="M3 5v5h5M4 10a8 8 0 1 1 1 7" />
        }
      }
    </svg>
  `,
  styles: `:host { display: inline-flex; } svg { width: 18px; height: 18px; }`,
})
export class ActionIconComponent {
  readonly name = input.required<'edit' | 'delete' | 'view' | 'restore'>();
}
