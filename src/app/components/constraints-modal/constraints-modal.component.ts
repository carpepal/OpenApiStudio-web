import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, SlidersHorizontal, X, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-constraints-modal',
  imports: [ReactiveFormsModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ SlidersHorizontal, X }) }],
  templateUrl: './constraints-modal.component.html',
})
export class ConstraintsModalComponent {
  @Input({ required: true }) prop!: FormGroup;
  @Output() closed = new EventEmitter<void>();

  get propType(): string {
    return this.prop.get('type')?.value ?? 'string';
  }

  isNumericType(type: string): boolean {
    return type === 'number' || type === 'integer';
  }

  isStringType(type: string): boolean {
    return type === 'string';
  }
}
