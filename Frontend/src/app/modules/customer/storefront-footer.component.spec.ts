import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { StorefrontFooterComponent } from './storefront-footer.component';

describe('storefront footer', () => {
  it('shows working navigation, upcoming services and a back-to-top control', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    TestBed.configureTestingModule({
      imports: [StorefrontFooterComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(StorefrontFooterComponent);
    fixture.detectChanges();
    const footer = fixture.nativeElement as HTMLElement;
    const links = footer.querySelectorAll<HTMLAnchorElement>('nav a');
    expect([...links].map(link => link.getAttribute('href'))).toEqual(['/', '/cricket']);
    expect(footer.querySelectorAll('.upcoming li')).toHaveLength(3);
    expect([...footer.querySelectorAll('.upcoming li')].every(item => item.textContent?.includes('Coming soon'))).toBe(true);
    expect(footer.textContent).toContain('Contact information coming soon.');
    expect(footer.textContent).toContain(`${new Date().getFullYear()} CricDynamics`);
    footer.querySelector<HTMLButtonElement>('.back-to-top')!.click();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    scrollTo.mockRestore();
  });
});
