import {
  Component,
  ElementRef,
  SecurityContext,
  forwardRef,
  inject,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

interface ToolbarAction {
  label: string;
  title: string;
  command: string;
  value?: string;
  style?: string;
}

@Component({
  selector: 'app-rich-text-editor',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RichTextEditorComponent), multi: true },
  ],
  template: `
    <div class="rte" [class.disabled]="disabled">
      <div class="rte-toolbar" role="toolbar" aria-label="Text formatting">
        <select aria-label="Block style" (change)="setBlock($event)">
          <option value="p">Paragraph</option>
          <option value="h2">Heading 1</option>
          <option value="h3">Heading 2</option>
          <option value="h4">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        @for (action of actions; track action.title) {
          <button
            type="button"
            [title]="action.title"
            [attr.aria-label]="action.title"
            [style]="action.style"
            [disabled]="disabled"
            (mousedown)="$event.preventDefault()"
            (click)="run(action)"
          >
            {{ action.label }}
          </button>
        }
        <button type="button" title="Insert link" aria-label="Insert link" [disabled]="disabled" (mousedown)="$event.preventDefault()" (click)="addLink()">🔗</button>
        <label class="rte-color" title="Text color">
          A
          <input type="color" value="#1c2b22" aria-label="Text color" (input)="setColor($event)" />
        </label>
      </div>
      <div
        #editor
        class="rte-content"
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        aria-label="Description"
        (input)="onInput()"
        (blur)="onTouched()"
        (paste)="onPaste($event)"
      ></div>
    </div>
  `,
  styles: `
    :host { display: block; }
    .rte { border: 1px solid #cfd9d2; border-radius: 9px; background: #fff; overflow: hidden; }
    .rte:focus-within { border-color: #6aa516; box-shadow: 0 0 0 3px rgb(103 151 55 / 20%); }
    .rte.disabled { opacity: 0.6; }
    .rte-toolbar {
      display: flex; flex-wrap: wrap; align-items: center; gap: 4px;
      padding: 6px; border-bottom: 1px solid #e3ebe5; background: #f6f9f6;
    }
    .rte-toolbar button, .rte-toolbar select, .rte-color {
      min-width: 30px; height: 30px; padding: 0 8px;
      border: 1px solid transparent; border-radius: 6px;
      background: transparent; color: #1c2b22; cursor: pointer; font-size: 13px;
    }
    .rte-toolbar select { border-color: #cfd9d2; background: #fff; }
    .rte-toolbar button:hover, .rte-color:hover { background: #e4eee6; }
    .rte-color { position: relative; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; }
    .rte-color input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
    .rte-content { min-height: 140px; max-height: 360px; overflow-y: auto; padding: 12px; outline: none; line-height: 1.5; }
    .rte-content:empty::before { content: 'Product details'; color: #94a39a; }
    .rte-content ul, .rte-content ol { margin: 6px 0; padding-left: 24px; }
    .rte-content blockquote { margin: 6px 0; padding-left: 12px; border-left: 3px solid #c9ef77; color: #55655b; }
    .rte-content h2, .rte-content h3, .rte-content h4 { margin: 8px 0; }
    .rte-content a { color: #2f7d32; text-decoration: underline; }
  `,
})
export class RichTextEditorComponent implements ControlValueAccessor {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly editor = viewChild.required<ElementRef<HTMLDivElement>>('editor');

  disabled = false;
  private pendingValue = '';
  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  readonly actions: ToolbarAction[] = [
    { label: 'B', title: 'Bold', command: 'bold', style: 'font-weight:700' },
    { label: 'I', title: 'Italic', command: 'italic', style: 'font-style:italic' },
    { label: 'U', title: 'Underline', command: 'underline', style: 'text-decoration:underline' },
    { label: 'S', title: 'Strikethrough', command: 'strikeThrough', style: 'text-decoration:line-through' },
    { label: '• List', title: 'Bulleted list', command: 'insertUnorderedList' },
    { label: '1. List', title: 'Numbered list', command: 'insertOrderedList' },
    { label: '⇤', title: 'Align left', command: 'justifyLeft' },
    { label: '↔', title: 'Align center', command: 'justifyCenter' },
    { label: '⇥', title: 'Align right', command: 'justifyRight' },
    { label: '→', title: 'Indent', command: 'indent' },
    { label: '←', title: 'Outdent', command: 'outdent' },
    { label: '⎌', title: 'Undo', command: 'undo' },
    { label: '↻', title: 'Redo', command: 'redo' },
    { label: 'Tx', title: 'Clear formatting', command: 'removeFormat' },
  ];

  writeValue(value: string | null): void {
    this.pendingValue = value ?? '';
    const element = this.editor().nativeElement;
    const html = this.sanitizer.sanitize(SecurityContext.HTML, this.pendingValue) ?? '';
    if (element.innerHTML !== html) {
      element.innerHTML = html;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    this.editor().nativeElement.contentEditable = String(!disabled);
  }

  onInput(): void {
    const html = this.editor().nativeElement.innerHTML;
    this.onChange(html === '<br>' ? '' : html);
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
  }

  run(action: ToolbarAction): void {
    this.editor().nativeElement.focus();
    document.execCommand(action.command, false, action.value);
    this.onInput();
  }

  setBlock(event: Event): void {
    const tag = (event.target as HTMLSelectElement).value;
    this.editor().nativeElement.focus();
    document.execCommand('formatBlock', false, tag);
    this.onInput();
  }

  setColor(event: Event): void {
    this.editor().nativeElement.focus();
    document.execCommand('foreColor', false, (event.target as HTMLInputElement).value);
    this.onInput();
  }

  addLink(): void {
    const url = window.prompt('Link URL (https://…)');
    if (!url || !/^(https?:\/\/|mailto:)/i.test(url.trim())) {
      return;
    }
    this.editor().nativeElement.focus();
    document.execCommand('createLink', false, url.trim());
    this.onInput();
  }
}
