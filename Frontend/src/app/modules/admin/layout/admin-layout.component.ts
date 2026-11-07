import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';

type AdminTheme = 'forest' | 'ocean' | 'plum' | 'slate';
const THEME_STORAGE_KEY = 'cricbazar.admin.theme';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  sidebarCollapsed = false;
  productsOpen = false;
  productChildrenOpen = false;
  readonly themes: { id: AdminTheme; name: string }[] = [
    { id: 'forest', name: 'Forest' },
    { id: 'ocean', name: 'Ocean' },
    { id: 'plum', name: 'Plum' },
    { id: 'slate', name: 'Slate' },
  ];
  theme: AdminTheme = 'forest';
  themeStorageError = '';

  ngOnInit(): void {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      this.theme = this.themes.find((theme) => theme.id === saved)?.id ?? 'forest';
    } catch (error) {
      console.warn('Unable to load the saved display theme.', error);
      this.themeStorageError = 'Your display choice could not be loaded from this browser.';
    }
    this.openCurrentSection(this.router.url);
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => this.openCurrentSection(event.urlAfterRedirects));
  }

  selectTheme(theme: AdminTheme): void {
    this.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      this.themeStorageError = '';
    } catch (error) {
      console.warn('Unable to save the display theme.', error);
      this.themeStorageError = 'Your display choice could not be saved in this browser.';
    }
  }

  private openCurrentSection(url: string): void {
    const path = url.split(/[?#]/, 1)[0].replace(/\/+$/, '');
    const catalogPages = ['/admin/brands', '/admin/categories'];
    const detailPages = ['/admin/products', '/admin/product-attributes', '/admin/product-variants', '/admin/product-images', '/admin/reviews'];
    if (catalogPages.includes(path) || detailPages.includes(path)) {
      this.productsOpen = true;
      if (detailPages.includes(path)) {
        this.productChildrenOpen = true;
      }
    }
  }

  toggleProducts(): void {
    if (this.sidebarCollapsed) {
      this.sidebarCollapsed = false;
      this.productsOpen = true;
    } else {
      this.productsOpen = !this.productsOpen;
    }
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
