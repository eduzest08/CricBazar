import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CatalogApiService } from '../../core/services/catalog-api.service';
import { StorefrontHeaderComponent } from './storefront-header.component';

describe('storefront header', () => {
  const api = {
    getCategories: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    api.getCategories.mockReturnValue(of([
      {
        id: 1, parentId: null, name: 'Bats', slug: 'bats', sortOrder: 1, isActive: true,
        children: [
          { id: 2, parentId: 1, name: 'English Willow', slug: 'english-willow', sortOrder: 1, isActive: true },
          { id: 3, parentId: 1, name: 'Inactive', slug: 'inactive', sortOrder: 2, isActive: false },
        ],
      },
    ]));
    TestBed.configureTestingModule({
      imports: [StorefrontHeaderComponent],
      providers: [
        provideRouter([]),
        { provide: CatalogApiService, useValue: api },
      ],
    });
  });

  it('opens the Cricket menu with category and subcategory links', async () => {
    const fixture = TestBed.createComponent(StorefrontHeaderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const toggle = element.querySelector<HTMLButtonElement>('.cricket-menu-toggle')!;

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('#cricket-category-menu')).toBeNull();
    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('.category-menu-category')?.textContent?.trim()).toBe('Bats');
    const subcategory = element.querySelector<HTMLAnchorElement>('.category-menu-subcategory');
    expect(subcategory?.textContent?.trim()).toBe('English Willow');
    expect(subcategory?.getAttribute('href')).toBe('/cricket/category/2');
    expect(element.textContent).not.toContain('Inactive');
    expect(element.querySelector('.shop-all-link')?.getAttribute('href')).toBe('/cricket');
  });

  it('closes the Cricket menu when clicking outside it', async () => {
    const fixture = TestBed.createComponent(StorefrontHeaderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const toggle = element.querySelector<HTMLButtonElement>('.cricket-menu-toggle')!;
    toggle.click();
    fixture.detectChanges();
    expect(element.querySelector('#cricket-category-menu')).not.toBeNull();

    element.querySelector<HTMLInputElement>('#catalog-search')!.click();
    fixture.detectChanges();
    expect(element.querySelector('#cricket-category-menu')).toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes the Cricket menu when Escape is pressed', async () => {
    const fixture = TestBed.createComponent(StorefrontHeaderComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.cricket-menu-toggle')!.click();
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(element.querySelector('#cricket-category-menu')).toBeNull();
  });
});
