import { Component, Input, signal } from '@angular/core';
import { OpenApiSchemaObject } from '../../../models/open-api.models';
import { SchemaRendererComponent } from './schema-renderer.component';
import {
  isRefSchema,
  isObjectSchema,
  isArraySchema,
  isPrimitiveSchema,
  isComposedSchema,
  isNotSchema,
} from './schema-type-guards';

@Component({
  selector: 'app-schemas-section',
  imports: [SchemaRendererComponent],
  template: `
    <div class="flex flex-col gap-2">
      @for (entry of schemaEntries(); track entry.name) {
        <div class="border border-border-light rounded-md overflow-hidden">
          <button
            class="w-full flex items-center gap-2 px-3 py-2 bg-surface text-left hover:bg-surface-muted transition-colors"
            (click)="toggle(entry.name)">
            <span class="font-mono text-xs font-semibold text-text-primary flex-1 min-w-0 truncate">{{ entry.name }}</span>
            <span class="px-2 py-0.5 text-xs rounded {{ kindClass(entry.schema) }} shrink-0">{{ kindLabel(entry.schema) }}</span>
            <span class="text-text-muted text-xs shrink-0">{{ isOpen(entry.name) ? '▲' : '▼' }}</span>
          </button>
          @if (isOpen(entry.name)) {
            <div class="px-3 py-2 bg-surface-alt border-t border-border-light">
              <app-schema-renderer [schema]="entry.schema" [depth]="0" />
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SchemasSectionComponent {
  @Input({ required: true }) set schemas(value: Record<string, OpenApiSchemaObject>) {
    this._schemas = value;
    this._open.set({});
  }
  get schemas(): Record<string, OpenApiSchemaObject> { return this._schemas; }

  private _schemas: Record<string, OpenApiSchemaObject> = {};
  private _open = signal<Record<string, boolean>>({});

  private readonly kindClasses: Record<string, string> = {
    object: 'bg-badge-teal-bg text-badge-teal-text',
    primitive: 'bg-badge-amber-bg text-badge-amber-text',
    array: 'bg-badge-blue-bg text-badge-blue-text',
    '$ref': 'bg-badge-slate-bg text-badge-slate-text',
    composed: 'bg-badge-purple-bg text-badge-purple-text',
    not: 'bg-badge-red-bg text-badge-red-text',
  };

  schemaEntries(): { name: string; schema: OpenApiSchemaObject }[] {
    return Object.entries(this._schemas).map(([name, schema]) => ({ name, schema }));
  }

  kindLabel(schema: OpenApiSchemaObject): string {
    if (isRefSchema(schema)) return '$ref';
    if (isNotSchema(schema)) return 'not';
    if (isComposedSchema(schema)) {
      if (schema.allOf) return 'allOf';
      if (schema.oneOf) return 'oneOf';
      if (schema.anyOf) return 'anyOf';
    }
    if (isObjectSchema(schema)) return 'object';
    if (isArraySchema(schema)) return 'array';
    if (isPrimitiveSchema(schema)) return 'primitive';
    return 'unknown';
  }

  kindClass(schema: OpenApiSchemaObject): string {
    const label = this.kindLabel(schema);
    if (label === 'allOf' || label === 'oneOf' || label === 'anyOf') return this.kindClasses['composed'];
    return this.kindClasses[label] ?? 'bg-badge-slate-bg text-badge-slate-text';
  }

  isOpen(name: string): boolean {
    return this._open()[name] ?? false;
  }

  toggle(name: string): void {
    const current = this._open();
    this._open.set({ ...current, [name]: !current[name] });
  }
}
