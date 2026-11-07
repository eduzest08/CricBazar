import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Category } from '../../../core/models/catalog.models';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { CategoryManagementComponent } from './category-management.component';

describe('CategoryManagementComponent hierarchy', () => {
  const category = (id: number, name: string, parentId: number | null): Category => ({
    id, name, parentId, slug: name.toLowerCase().replaceAll(' ', '-'), sortOrder: id, isActive: true,
  });
  const bat = category(1, 'Bat', null);
  const willow = category(2, 'English Willow', 1);
  const premium = category(3, 'Premium English Willow', 2);
  const ball = category(4, 'Ball', null);
  let items: Category[];
  const api = {
    getCategories: () => of(items),
    deleteCategory: vi.fn(() => of(undefined)),
    reorderCategories: vi.fn(() => of<void>(undefined)),
  };

  beforeEach(async () => {
    items = [premium, ball, willow, bat];
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [CategoryManagementComponent],
      providers: [{ provide: CatalogApiService, useValue: api }],
    }).compileComponents();
  });

  it('expands and collapses multiple levels while preserving child actions', () => {
    const fixture = TestBed.createComponent(CategoryManagementComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const button = (label: string) => element.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
    expect(element.querySelector('tbody')?.textContent).not.toContain('English Willow');
    expect(button('Expand Bat category').getAttribute('aria-expanded')).toBe('false');
    button('Expand Bat category').click();
    fixture.detectChanges();
    expect(element.querySelector('tbody')?.textContent).toContain('English Willow');
    expect(element.querySelector('tbody')?.textContent).not.toContain('Premium English Willow');
    button('Expand English Willow category').click();
    fixture.detectChanges();
    const names = Array.from(element.querySelectorAll('tbody .category-name strong'), (node) => node.textContent?.trim());
    expect(names).toEqual(['Ball', 'Bat', 'English Willow', 'Premium English Willow']);
    expect(button('Collapse English Willow category').getAttribute('aria-expanded')).toBe('true');
    const rows = element.querySelectorAll<HTMLTableRowElement>('tbody tr');
    expect(rows[3].querySelector<HTMLElement>('.category-name')?.style.paddingLeft).toBe('48px');
    rows[3].querySelectorAll<HTMLButtonElement>('.actions button')[1].click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')?.textContent).toContain('Premium English Willow');
    fixture.componentInstance.cancelDelete();
    button('Collapse Bat category').click();
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('shows matching descendants with ancestors expanded and permits collapsing during search', async () => {
    const fixture = TestBed.createComponent(CategoryManagementComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('[aria-label="Search categories"]')!;
    input.value = 'premium';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(Array.from(element.querySelectorAll('tbody .category-name strong'), (node) => node.textContent?.trim()))
      .toEqual(['Bat', 'English Willow', 'Premium English Willow']);
    expect(element.textContent).toContain('1 categories');
    element.querySelector<HTMLButtonElement>('[aria-label="Collapse Bat category"]')!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('paginates root groups without separating children and sorts parent groups', () => {
    items = [bat, willow, premium, ball, category(5, 'Ash', 1), ...Array.from({ length: 5 }, (_, i) => category(10 + i, `Root ${i}`, null))];
    const fixture = TestBed.createComponent(CategoryManagementComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.changePageSize(5);
    component.toggleCategory(component.categoryTree.rows.find((row) => row.category.id === 1)!);
    fixture.detectChanges();
    expect(component.categoryTree.pageCount).toBe(2);
    expect(component.categoryTree.rows.slice(1, 4).map((row) => row.category.name)).toEqual(['Bat', 'English Willow', 'Ash']);
    component.sort('name');
    component.changePage(2);
    const rowNames = component.categoryTree.rows.map((row) => row.category.name);
    expect(rowNames.indexOf('English Willow')).toBeLessThan(rowNames.indexOf('Ash'));
    expect(component.categoryTree.rows.map((row) => row.category.name)).toContain('Bat');
    expect(component.categoryTree.rows.map((row) => row.category.name)).toContain('English Willow');
  });

  it('orders children by Sort Order at every level regardless of parent sorting or search', () => {
    items = [
      bat,
      { ...category(2, 'Zebra', 1), sortOrder: 1 },
      { ...category(3, 'Alpha', 1), sortOrder: 2 },
      { ...category(4, 'Beta', 1), sortOrder: 2 },
      { ...category(5, 'Zulu child', 2), sortOrder: -1 },
      { ...category(6, 'Alpha child', 2), sortOrder: 3 },
      { ...category(7, 'Alpha', 1), sortOrder: 2 },
    ];
    const fixture = TestBed.createComponent(CategoryManagementComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.toggleCategory(component.categoryTree.rows[0]);
    component.toggleCategory(component.categoryTree.rows[1]);
    const ids = () => component.categoryTree.rows.map((row) => row.category.id);
    expect(ids()).toEqual([1, 2, 5, 6, 3, 7, 4]);
    component.sort('name');
    expect(ids()).toEqual([1, 2, 5, 6, 3, 7, 4]);
    component.sort('sortOrder');
    component.sort('sortOrder');
    expect(ids()).toEqual([1, 2, 5, 6, 3, 7, 4]);
    component.searchTerm = 'child';
    component.search();
    expect(ids()).toEqual([1, 2, 5, 6]);
    items = items.map((item) => item.id === 3 ? { ...item, sortOrder: 0 } : item);
    component.searchTerm = '';
    component.loadCategories();
    expect(ids()).toEqual([1, 3, 2, 5, 6, 7, 4]);
  });

  it('keeps orphaned and cyclic categories visible with an error message', () => {
    items = [category(1, 'Loop A', 2), category(2, 'Loop B', 1), category(3, 'Orphan', 99)];
    const fixture = TestBed.createComponent(CategoryManagementComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.categoryTree.hasInvalidHierarchy).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('missing or circular parents');
    component.toggleCategory(component.categoryTree.rows.find((row) => row.category.id === 1)!);
    expect(component.categoryTree.rows.map((row) => row.category.id)).toEqual([1, 2, 3]);
  });

  it('clamps the current page when refresh removes groups', () => {
    items = Array.from({ length: 11 }, (_, i) => category(i + 1, `Root ${i}`, null));
    const fixture = TestBed.createComponent(CategoryManagementComponent);
    fixture.detectChanges();
    fixture.componentInstance.changePage(2);
    items = [bat];
    fixture.componentInstance.loadCategories();
    expect(fixture.componentInstance.pageNumber).toBe(1);
  });

  it('moves a child using the arrows and persists all siblings without changing parents', () => {
    items = [bat, willow, category(5, 'Ash', 1), premium, ball];
    const fixture = TestBed.createComponent(CategoryManagementComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('[aria-label="Expand Bat category"]')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('[aria-label="Move Ash up"]')!.click();
    fixture.detectChanges();
    expect(api.reorderCategories).toHaveBeenCalledWith(1, [{ id: 5, sortOrder: 5 }, { id: 2, sortOrder: 2 }]);
    expect(component.categoryTree.rows.map((row) => row.category.id)).toEqual([4, 1, 5, 2]);
    expect(component.categories.find((item) => item.id === 5)?.sortOrder).toBe(0);
    expect(element.textContent).toContain('Category order saved.');
  });

  it('accepts a sibling drop and rejects cross-parent drops', () => {
    items = [bat, willow, category(5, 'Ash', 1), premium, ball];
    const fixture = TestBed.createComponent(CategoryManagementComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.toggleCategory(component.categoryTree.rows.find((row) => row.category.id === 1)!);
    const transfer = { effectAllowed: '', dropEffect: '', setData: vi.fn() };
    const event = new Event('dragover', { cancelable: true }) as DragEvent;
    Object.defineProperty(event, 'dataTransfer', { value: transfer });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    component.dragStart(event, willow);
    component.dragOver(event, premium);
    component.drop(event, premium);
    expect(api.reorderCategories).not.toHaveBeenCalled();
    component.dragStart(event, willow);
    component.dragOver(event, items[2]);
    expect(preventDefault).toHaveBeenCalled();
    component.drop(event, items[2]);
    expect(api.reorderCategories).toHaveBeenCalledWith(1, [{ id: 5, sortOrder: 5 }, { id: 2, sortOrder: 2 }]);
  });

  it('prevents reorder during search, editing and a pending request', () => {
    items = [bat, willow, category(5, 'Ash', 1), ball];
    const pending = new Subject<void>();
    api.reorderCategories.mockReturnValueOnce(pending);
    const fixture = TestBed.createComponent(CategoryManagementComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.canReorder(bat)).toBe(false);
    component.sort('sortOrder');
    expect(component.canReorder(willow)).toBe(true);
    component.searchTerm = 'bat';
    expect(component.canReorder(willow)).toBe(false);
    component.searchTerm = '';
    component.editingId = 1;
    expect(component.canReorder(willow)).toBe(false);
    component.editingId = null;
    component.moveCategory(willow, 1);
    expect(component.reordering).toBe(true);
    expect(component.canReorder(willow)).toBe(false);
    pending.next();
    pending.complete();
    expect(component.reordering).toBe(false);
  });

  it('reports a conflict without changing the displayed order', () => {
    items = [bat, willow, category(5, 'Ash', 1)];
    api.reorderCategories.mockReturnValueOnce(throwError(() => new Error('conflict')));
    const fixture = TestBed.createComponent(CategoryManagementComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    component.moveCategory(willow, 1);
    expect(component.categories.find((item) => item.id === 2)?.sortOrder).toBe(2);
    expect(component.errorMessage).toContain('conflict');
    expect(component.reordering).toBe(false);
  });

  it('hides reorder controls for main categories but keeps them for children', () => {
    items = [bat, ball, willow, category(5, 'Ash', 1)];
    const fixture = TestBed.createComponent(CategoryManagementComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;
    component.sort('sortOrder');
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody .drag-handle, tbody .reorder-arrows')).toHaveLength(0);
    expect(component.canReorder(bat)).toBe(false);
    component.moveCategory(bat, 1);
    expect(api.reorderCategories).not.toHaveBeenCalled();
    element.querySelector<HTMLButtonElement>('[aria-label="Expand Bat category"]')!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('tbody .drag-handle')).toHaveLength(2);
    expect(element.querySelector<HTMLButtonElement>('[aria-label="Move Ash up"]')?.disabled).toBe(false);
    expect(element.querySelector('[aria-label="Move Bat up"]')).toBeNull();
    expect(element.querySelector('[aria-label="Move Ball down"]')).toBeNull();
  });
});
