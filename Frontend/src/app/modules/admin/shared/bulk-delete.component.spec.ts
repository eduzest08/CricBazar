import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { BulkDeleteComponent } from './bulk-delete.component';

describe('BulkDeleteComponent', () => {
  const api = {
    deleteBrand: vi.fn(),
    deleteProduct: vi.fn(),
    deleteProductPermanently: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      imports: [BulkDeleteComponent],
      providers: [{ provide: CatalogApiService, useValue: api }],
    });
  });

  it('selects only current-page items and requires confirmation', () => {
    api.deleteBrand.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(BulkDeleteComponent);
    fixture.componentRef.setInput('kind', 'brand');
    fixture.componentRef.setInput('items', [{ id: 1 }, { id: 2 }]);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLInputElement>('input[type=checkbox]')!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.allSelected).toBe(true);
    element.querySelector<HTMLButtonElement>('.bulk-toolbar button')!.click();
    fixture.detectChanges();
    expect(api.deleteBrand).not.toHaveBeenCalled();
    expect(element.querySelector('[role=dialog]')?.textContent).toContain('Selected IDs: 1, 2');
    element.querySelector<HTMLButtonElement>('.bulk-confirm')!.click();
    fixture.detectChanges();
    expect(api.deleteBrand.mock.calls).toEqual([[1], [2]]);
    expect(element.textContent).toContain('2 item(s) deleted');
    expect(fixture.componentInstance.selected.size).toBe(0);
  });

  it('retains failed selections and reports individual errors after partial success', () => {
    api.deleteBrand.mockImplementation((id: number) =>
      id === 1 ? of(undefined) : throwError(() => new Error('Brand is in use')));
    const fixture = TestBed.createComponent(BulkDeleteComponent);
    fixture.componentRef.setInput('kind', 'brand');
    fixture.componentRef.setInput('items', [{ id: 1 }, { id: 2 }]);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const completed = vi.spyOn(component.completed, 'emit');
    component.toggleAll();
    component.confirm();
    fixture.detectChanges();
    expect(completed).toHaveBeenCalledWith([1]);
    expect([...component.selected]).toEqual([2]);
    expect((fixture.nativeElement as HTMLElement).querySelector('[role=alert]')?.textContent)
      .toContain('#2: Brand is in use');
  });

  it('uses the correct product deletion action and prevents duplicate submissions', () => {
    const request = new Subject<void>();
    api.deleteProduct.mockReturnValue(request);
    api.deleteProductPermanently.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(BulkDeleteComponent);
    fixture.componentRef.setInput('kind', 'product');
    fixture.componentRef.setInput('items', [{ id: 1, isActive: true }]);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.toggleAll();
    component.confirm();
    component.confirm();
    expect(api.deleteProduct).toHaveBeenCalledTimes(1);
    expect(component.busy).toBe(true);
    request.next();
    request.complete();
    fixture.componentRef.setInput('items', [{ id: 2, isActive: false }]);
    fixture.detectChanges();
    component.toggleAll();
    component.confirm();
    expect(api.deleteProductPermanently).toHaveBeenCalledWith(2);
  });

  it('discloses both actions and reports mixed product deletion results accurately', () => {
    api.deleteProduct.mockReturnValue(of(undefined));
    api.deleteProductPermanently.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(BulkDeleteComponent);
    fixture.componentRef.setInput('kind', 'product');
    fixture.componentRef.setInput('items', [{ id: 1, isActive: true }, { id: 2, isActive: false }]);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.bulk-toolbar input')!.click();
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.bulk-toolbar button')!.click();
    fixture.detectChanges();
    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role=dialog]')!;
    expect(dialog.textContent).toContain('1 selected active or progress');
    expect(dialog.textContent).toContain('1 selected inactive');
    expect(dialog.textContent).toContain('permanently deleted');
    expect(dialog.textContent).toContain('Selected IDs: 1, 2');
    component.confirm();
    expect(api.deleteProduct).toHaveBeenCalledWith(1);
    expect(api.deleteProductPermanently).toHaveBeenCalledWith(2);
    expect(component.message).toContain('1 product(s) moved to Inactive');
    expect(component.message).toContain('1 product(s) permanently deleted');
  });

  it('reports only successful actions after a partial mixed product deletion', () => {
    api.deleteProduct.mockReturnValue(throwError(() => new Error('Move failed')));
    api.deleteProductPermanently.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(BulkDeleteComponent);
    fixture.componentRef.setInput('kind', 'product');
    fixture.componentRef.setInput('items', [{ id: 1, isActive: true }, { id: 2, isActive: false }]);
    fixture.detectChanges();
    fixture.componentInstance.toggleAll();
    fixture.componentInstance.confirm();
    expect(fixture.componentInstance.message).toBe('1 product(s) permanently deleted.');
    expect(fixture.componentInstance.errors).toEqual(['#1: Move failed']);
    expect([...fixture.componentInstance.selected]).toEqual([1]);
  });

  it('removes selections no longer present on the current page', () => {
    const fixture = TestBed.createComponent(BulkDeleteComponent);
    fixture.componentRef.setInput('kind', 'brand');
    fixture.componentRef.setInput('items', [{ id: 1 }, { id: 2 }]);
    fixture.detectChanges();
    fixture.componentInstance.toggleAll();
    fixture.componentRef.setInput('items', [{ id: 3 }]);
    fixture.detectChanges();
    expect(fixture.componentInstance.selected.size).toBe(0);
  });
});
