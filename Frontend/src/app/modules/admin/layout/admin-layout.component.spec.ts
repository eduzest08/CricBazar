import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';

describe('AdminLayoutComponent navigation', () => {
  beforeEach(async () => {
    localStorage.removeItem('cricbazar.admin.theme');
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.removeItem('cricbazar.admin.theme');
  });

  it('reveals catalog sections for the current route', () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/admin/product-images');
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.productsOpen).toBe(true);
    expect(fixture.componentInstance.productChildrenOpen).toBe(true);
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href="/admin/product-images"]')).not.toBeNull();
  });

  it('opens the products menu when selected from the collapsed sidebar', () => {
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
    fixture.componentInstance.sidebarCollapsed = true;
    fixture.componentInstance.productsOpen = true;
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.folder-toggle')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.sidebarCollapsed).toBe(false);
    expect(fixture.componentInstance.productsOpen).toBe(true);
    expect(element.querySelector('a[href="/admin/categories"]')).not.toBeNull();
    expect(element.querySelector<HTMLButtonElement>('.logout-button')?.getAttribute('aria-label')).toBe('Sign out');
  });

  it('shows plus and minus icons when product details is collapsed and expanded', () => {
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.folder-toggle')!.click();
    fixture.detectChanges();
    const details = element.querySelector<HTMLButtonElement>('.subfolder-label')!;

    expect(details.getAttribute('aria-expanded')).toBe('false');
    expect(details.querySelector('.plus-vertical')).not.toBeNull();
    expect(element.querySelector('a[href="/admin/product-images"]')).toBeNull();

    details.click();
    fixture.detectChanges();
    expect(details.getAttribute('aria-expanded')).toBe('true');
    expect(details.querySelector('.plus-vertical')).toBeNull();
    expect(element.querySelector('a[href="/admin/product-images"]')).not.toBeNull();

    details.click();
    fixture.detectChanges();
    expect(details.getAttribute('aria-expanded')).toBe('false');
    expect(details.querySelector('.plus-vertical')).not.toBeNull();
    expect(element.querySelector('a[href="/admin/product-images"]')).toBeNull();
  });

  it('switches and remembers the chosen display theme', () => {
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const ocean = element.querySelector<HTMLButtonElement>('[aria-label="Ocean display color"]')!;
    expect(element.querySelector('.admin-shell')?.getAttribute('data-theme')).toBe('forest');
    ocean.click();
    fixture.detectChanges();
    expect(element.querySelector('.admin-shell')?.getAttribute('data-theme')).toBe('ocean');
    expect(ocean.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('cricbazar.admin.theme')).toBe('ocean');

    fixture.destroy();
    const next = TestBed.createComponent(AdminLayoutComponent);
    next.detectChanges();
    expect(next.componentInstance.theme).toBe('ocean');
  });

  it('falls back safely for an unknown saved theme', () => {
    localStorage.setItem('cricbazar.admin.theme', 'unknown');
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.theme).toBe('forest');
  });

  it('shows a message if the browser cannot save the choice', () => {
    const fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
    vi.stubGlobal('localStorage', {
      setItem: () => { throw new Error('Storage unavailable'); },
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[aria-label="Plum display color"]')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.theme).toBe('plum');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')?.textContent)
      .toContain('could not be saved');
  });
});
