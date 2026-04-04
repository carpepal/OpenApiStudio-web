import { Component, Input } from '@angular/core';
import { OpenApiSchemaObject } from '../../../models/open-api.models';
import {
  isRefSchema,
  isNotSchema,
  isComposedSchema,
  isObjectSchema,
  isArraySchema,
  isPrimitiveSchema,
} from './schema-type-guards';

@Component({
  selector: 'app-schema-renderer',
  template: `
    @if (depth < 6) {
      <div [class]="depth > 0 ? 'pl-3 border-l-2 border-border-light' : ''">
        @if (isRef(schema)) {
          <span class="text-xs font-mono text-accent">{{ schema['$ref'] }}</span>
        } @else if (isNot(schema)) {
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-badge-red-text">not</span>
            <app-schema-renderer [schema]="schema['not']" [depth]="depth + 1" />
          </div>
        } @else if (isComposed(schema)) {
          <div class="flex flex-col gap-1">
            @if (schema['allOf']) {
              <span class="text-xs font-medium text-badge-purple-text">allOf</span>
              @for (sub of schema['allOf']; track $index) {
                <app-schema-renderer [schema]="sub" [depth]="depth + 1" />
              }
            }
            @if (schema['oneOf']) {
              <span class="text-xs font-medium text-badge-purple-text">oneOf</span>
              @for (sub of schema['oneOf']; track $index) {
                <app-schema-renderer [schema]="sub" [depth]="depth + 1" />
              }
            }
            @if (schema['anyOf']) {
              <span class="text-xs font-medium text-badge-purple-text">anyOf</span>
              @for (sub of schema['anyOf']; track $index) {
                <app-schema-renderer [schema]="sub" [depth]="depth + 1" />
              }
            }
          </div>
        } @else if (isObject(schema)) {
          <div class="flex flex-col gap-1">
            @if (schema['properties'] && objectKeys(schema['properties']).length > 0) {
              <div class="grid text-xs" style="grid-template-columns: auto auto auto; gap: 0 0.75rem;">
                <span class="font-medium text-text-muted uppercase tracking-wide pb-1">Name</span>
                <span class="font-medium text-text-muted uppercase tracking-wide pb-1">Type</span>
                <span class="font-medium text-text-muted uppercase tracking-wide pb-1">Req</span>
                @for (key of objectKeys(schema['properties']!); track key) {
                  <span class="font-mono text-text-primary py-0.5 border-t border-border-light">{{ key }}</span>
                  <span class="font-mono text-text-secondary py-0.5 border-t border-border-light">{{ schemaType(schema['properties']![key]) }}</span>
                  <span class="py-0.5 border-t border-border-light">
                    @if (isRequired(schema, key)) {
                      <span class="text-badge-red-text">*</span>
                    } @else {
                      <span class="text-text-muted">-</span>
                    }
                  </span>
                }
              </div>
            } @else {
              <span class="text-xs text-text-muted italic">object (no properties)</span>
            }
            @if (additionalProps(schema)) {
              <div class="mt-1">
                <span class="text-xs text-text-muted">additionalProperties:</span>
                <app-schema-renderer [schema]="additionalProps(schema)!" [depth]="depth + 1" />
              </div>
            }
          </div>
        } @else if (isArray(schema)) {
          <div class="flex flex-col gap-1">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-xs font-mono text-badge-blue-text">array of</span>
              @if (schema['minItems'] !== undefined) {
                <span class="text-xs text-text-muted">min: {{ schema['minItems'] }}</span>
              }
              @if (schema['maxItems'] !== undefined) {
                <span class="text-xs text-text-muted">max: {{ schema['maxItems'] }}</span>
              }
              @if (schema['uniqueItems']) {
                <span class="text-xs text-text-muted">unique</span>
              }
            </div>
            <app-schema-renderer [schema]="schema['items']" [depth]="depth + 1" />
          </div>
        } @else if (isPrimitive(schema)) {
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs font-mono text-badge-amber-text">{{ schema['type'] }}</span>
            @if (schema['format']) {
              <span class="text-xs font-mono text-text-muted">({{ schema['format'] }})</span>
            }
            @if (schema['enum']) {
              @for (val of schema['enum']; track $index) {
                <span class="px-1.5 py-0.5 text-xs font-mono rounded bg-surface-muted text-text-secondary">{{ val }}</span>
              }
            }
            @if (schema['minimum'] !== undefined) {
              <span class="text-xs text-text-muted">min: {{ schema['minimum'] }}</span>
            }
            @if (schema['maximum'] !== undefined) {
              <span class="text-xs text-text-muted">max: {{ schema['maximum'] }}</span>
            }
            @if (schema['minLength'] !== undefined) {
              <span class="text-xs text-text-muted">minLen: {{ schema['minLength'] }}</span>
            }
            @if (schema['maxLength'] !== undefined) {
              <span class="text-xs text-text-muted">maxLen: {{ schema['maxLength'] }}</span>
            }
            @if (schema['pattern']) {
              <span class="text-xs font-mono text-text-muted">pattern: {{ schema['pattern'] }}</span>
            }
          </div>
        } @else {
          <span class="text-xs text-text-muted italic">unknown schema</span>
        }
      </div>
    } @else {
      <span class="text-xs text-text-muted italic">...</span>
    }
  `,
})
export class SchemaRendererComponent {
  @Input({ required: true }) schema!: OpenApiSchemaObject;
  @Input() depth: number = 0;

  readonly isRef = isRefSchema;
  readonly isNot = isNotSchema;
  readonly isComposed = isComposedSchema;
  readonly isObject = isObjectSchema;
  readonly isArray = isArraySchema;
  readonly isPrimitive = isPrimitiveSchema;

  objectKeys(obj: object): string[] {
    return Object.keys(obj);
  }

  schemaType(schema: OpenApiSchemaObject): string {
    if (isRefSchema(schema)) return schema.$ref.split('/').pop() ?? schema.$ref;
    if (isArraySchema(schema)) return 'array';
    if (isObjectSchema(schema)) return 'object';
    if (isPrimitiveSchema(schema)) return schema.type;
    if (isComposedSchema(schema)) {
      if (schema.allOf) return 'allOf';
      if (schema.oneOf) return 'oneOf';
      if (schema.anyOf) return 'anyOf';
    }
    if (isNotSchema(schema)) return 'not';
    return 'unknown';
  }

  isRequired(schema: { required?: string[] }, key: string): boolean {
    return schema.required?.includes(key) ?? false;
  }

  additionalProps(schema: OpenApiSchemaObject): OpenApiSchemaObject | null {
    if (!isObjectSchema(schema)) return null;
    const ap = schema.additionalProperties;
    if (!ap) return null;
    return ap as OpenApiSchemaObject;
  }
}
