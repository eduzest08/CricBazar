import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';
import { CatalogApiService } from '../../../core/services/catalog-api.service';
import { getApiErrorMessage } from '../../../core/utils/api-error';

type DeleteKind = 'product' | 'brand' | 'category' | 'attribute' | 'variant' | 'image' | 'review';
type SelectableItem = { id: number; isActive?: boolean };

@Component({
  selector: 'app-bulk-delete',
  exportAs: 'bulkDelete',
  template: `
    <div class="bulk-toolbar">
      <label>
        <input type="checkbox" [checked]="allSelected" [indeterminate]="someSelected && !allSelected"
          [disabled]="disabled || busy || !items.length" (change)="toggleAll()" />
        Select all on this page ({{ items.length }})
      </label>
      <button type="button" class="button button-secondary" [disabled]="disabled || busy || !selected.size"
        (click)="confirming = true">Delete selected ({{ selected.size }})</button>
    </div>
    @if (message) { <div class="bulk-message" role="status">{{ message }}</div> }
    @if (errors.length) {
      <div class="bulk-error" role="alert">
        Some items could not be deleted:
        <ul>@for (error of errors; track error) { <li>{{ error }}</li> }</ul>
      </div>
    }
    @if (confirming) {
      <div class="bulk-backdrop" (click)="cancel()" (keydown.escape)="cancel()">
        <div class="bulk-dialog" role="dialog" aria-modal="true" aria-labelledby="bulk-delete-title" (click)="$event.stopPropagation()">
          <h3 id="bulk-delete-title">Delete {{ selected.size }} selected {{ kind }} item(s)?</h3>
          @if (kind === 'product') {
            @if (selectedActiveCount) {
              <p>{{ selectedActiveCount }} selected active or progress product(s) will be moved to Inactive and can be restored later.</p>
            }
            @if (selectedInactiveCount) {
              <p>{{ selectedInactiveCount }} selected inactive product(s) and their images, attributes, variants, reviews, cart and wishlist entries will be permanently deleted. This cannot be undone. Products linked to order history cannot be deleted.</p>
            }
          } @else {
            <p>This action cannot be undone. Only selected items on this page will be deleted.</p>
          }
          <p>Selected IDs: {{ selectedIds }}</p>
          <div class="bulk-actions">
            <button type="button" class="button button-secondary" [disabled]="busy" (click)="cancel()">Cancel</button>
            <button type="button" class="button bulk-confirm" [disabled]="busy || !selected.size" (click)="confirm()">{{ busy ? 'Deleting…' : 'Delete' }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .bulk-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 20px; border-top: 1px solid #e6e9ed; flex-wrap: wrap; }
    .bulk-toolbar label { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }
    .bulk-toolbar input { accent-color: var(--theme-link, #386634); }
    .bulk-message, .bulk-error { margin: 0 20px 12px; padding: 10px 12px; border-radius: 4px; font-size: 12px; }
    .bulk-message { color: #3c662f; background: #f5faee; }
    .bulk-error { color: #913e35; background: #fff5f3; }
    .bulk-error ul { margin: 8px 0 0; padding-left: 20px; }
    .bulk-backdrop { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgb(0 0 0 / 50%); }
    .bulk-dialog { width: min(420px, 90%); padding: 24px; border-radius: 8px; background: #fff; box-shadow: 0 10px 30px rgb(0 0 0 / 30%); }
    .bulk-dialog h3 { margin: 0 0 12px; }
    .bulk-dialog p { margin: 0 0 20px; }
    .bulk-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .bulk-confirm { color: #fff; background: #c62828; border-color: #c62828; }
  `],
})
export class BulkDeleteComponent implements OnChanges {
  private readonly api = inject(CatalogApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  @Input({ required: true }) items: readonly SelectableItem[] = [];
  @Input({ required: true }) kind!: DeleteKind;
  @Input() disabled = false;
  @Output() completed = new EventEmitter<number[]>();

  readonly selected = new Set<number>();
  confirming = false;
  busy = false;
  message = '';
  errors: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    const previousItems: readonly SelectableItem[] | undefined = changes['items']?.previousValue;
    if (previousItems && !this.busy && [...this.selected].some(id => {
      const previous = previousItems.find(item => item.id === id);
      const current = this.items.find(item => item.id === id);
      return !previous || !current || previous.isActive !== current.isActive;
    })) {
      this.confirming = false;
    }
    const ids = new Set(this.items.map(item => item.id));
    for (const id of this.selected) {
      if (!ids.has(id)) this.selected.delete(id);
    }
  }

  get allSelected(): boolean {
    return this.items.length > 0 && this.items.every(item => this.selected.has(item.id));
  }

  get someSelected(): boolean {
    return this.selected.size > 0;
  }

  get selectedIds(): string {
    return this.items.filter(item => this.selected.has(item.id)).map(item => item.id).join(', ');
  }

  get selectedActiveCount(): number {
    return this.items.filter(item => this.selected.has(item.id) && item.isActive).length;
  }

  get selectedInactiveCount(): number {
    return this.items.filter(item => this.selected.has(item.id) && item.isActive === false).length;
  }

  toggle(id: number): void {
    if (this.busy || this.disabled) return;
    if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
    this.changeDetector.markForCheck();
  }

  toggleAll(): void {
    if (this.busy || this.disabled) return;
    if (this.allSelected) this.selected.clear();
    else for (const item of this.items) this.selected.add(item.id);
  }

  cancel(): void {
    if (!this.busy) this.confirming = false;
  }

  resetSelection(): void {
    if (this.busy) return;
    this.selected.clear();
    this.confirming = false;
  }

  confirm(): void {
    if (this.busy || this.disabled || !this.selected.size) return;
    const chosen = this.items.filter(item => this.selected.has(item.id));
    this.busy = true;
    this.message = '';
    this.errors = [];
    from(chosen).pipe(
      concatMap(item => this.deleteItem(item).pipe(
        map(() => ({ id: item.id, ok: true, error: '' })),
        catchError((error: unknown) => of({
          id: item.id,
          ok: false,
          error: getApiErrorMessage(error) || 'The delete request failed.',
        })),
      )),
      toArray(),
    ).subscribe(results => {
      const deleted = results.filter(result => result.ok).map(result => result.id);
      this.errors = results.filter(result => !result.ok).map(result => `#${result.id}: ${result.error}`);
      for (const id of deleted) this.selected.delete(id);
      if (this.kind === 'product') {
        const moved = chosen.filter(item => item.isActive && deleted.includes(item.id)).length;
        const permanent = deleted.length - moved;
        this.message = [moved ? `${moved} product(s) moved to Inactive.` : '', permanent ? `${permanent} product(s) permanently deleted.` : ''].filter(Boolean).join(' ');
      } else {
        this.message = deleted.length ? `${deleted.length} item(s) deleted.` : '';
      }
      this.busy = false;
      this.confirming = false;
      if (deleted.length) this.completed.emit(deleted);
      this.changeDetector.markForCheck();
    });
  }

  private deleteItem(item: SelectableItem) {
    switch (this.kind) {
      case 'product': return item.isActive ? this.api.deleteProduct(item.id) : this.api.deleteProductPermanently(item.id);
      case 'brand': return this.api.deleteBrand(item.id);
      case 'category': return this.api.deleteCategory(item.id);
      case 'attribute': return this.api.deleteProductAttribute(item.id);
      case 'variant': return this.api.deleteProductVariant(item.id);
      case 'image': return this.api.deleteProductImage(item.id);
      case 'review': return this.api.deleteReview(item.id);
    }
  }
}
