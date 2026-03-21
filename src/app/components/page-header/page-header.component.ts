import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule, Plus, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-page-header',
  imports: [LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Plus }) }],
  template: `
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <lucide-icon [name]="icon" [size]="24" class="text-accent"></lucide-icon>
        <div>
          <h2 class="text-xl font-semibold text-text-primary">{{ title }}</h2>
          <p class="text-sm text-text-secondary">{{ subtitle }}</p>
        </div>
      </div>
      @if (actionLabel) {
        <button
          type="button"
          (click)="action.emit()"
          class="flex items-center gap-2 bg-accent text-text-on-dark text-sm font-semibold rounded-md px-5 py-2.5 hover:bg-accent-hover transition-colors">
          <lucide-icon name="plus" [size]="16"></lucide-icon>
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) subtitle!: string;
  @Input() actionLabel?: string;
  @Output() action = new EventEmitter<void>();
}
