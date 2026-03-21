import { Component, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';
import { OpenApiStateService } from '../../services/open-api-state.service';
import { LucideAngularModule, Braces, Plus, Trash2, CircleCheck, TriangleAlert, SlidersHorizontal, X, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-schemas',
  imports: [MainComponent, ReactiveFormsModule, LucideAngularModule],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useFactory: () => new LucideIconProvider({ Braces, Plus, Trash2, CircleCheck, TriangleAlert, SlidersHorizontal, X }) }],
  templateUrl: './schemas.component.html',
  styleUrl: './schemas.component.scss',
})
export class SchemasComponent implements OnInit {
  constraintModal: { schI: number; propI: number } | null = null;
  readonly kinds = ['object', 'primitive', 'array', '$ref', 'allOf', 'oneOf', 'anyOf', 'not'];
  readonly kindLabels: Record<string, string> = {
    object: 'Objeto',
    primitive: 'Primitivo',
    array: 'Array',
    '$ref': 'Referencia ($ref)',
    allOf: 'allOf',
    oneOf: 'oneOf',
    anyOf: 'anyOf',
    not: 'not',
  };

  readonly primitiveTypes = ['string', 'integer', 'number', 'boolean'];
  readonly stringFormats = ['', 'date', 'date-time', 'email', 'uri', 'uuid', 'password', 'enum'];
  readonly numberFormats = ['', 'float', 'double', 'int32', 'int64', 'enum'];
  readonly propertyTypes = [
    'string', 'integer', 'number', 'boolean',
    '$ref',
    'string[]', 'integer[]', 'number[]', 'boolean[]',
    '$ref[]',
    'allOf', 'oneOf', 'anyOf', 'not',
  ];

  readonly kindBadgeClasses: Record<string, string> = {
    object: 'bg-badge-teal-bg text-badge-teal-text',
    primitive: 'bg-badge-amber-bg text-badge-amber-text',
    array: 'bg-badge-blue-bg text-badge-blue-text',
    '$ref': 'bg-badge-slate-bg text-badge-slate-text',
    allOf: 'bg-badge-purple-bg text-badge-purple-text',
    oneOf: 'bg-badge-purple-bg text-badge-purple-text',
    anyOf: 'bg-badge-purple-bg text-badge-purple-text',
    not: 'bg-badge-red-bg text-badge-red-text',
  };

  constructor(public forms: OpenApiFormsService, public state: OpenApiStateService) {}

  ngOnInit(): void {
    // Setup enum type-change listeners for existing schemas
    for (const schema of this.forms.schemaGroups) {
      this.setupEnumTypeChangeListener(schema);
      this.setupAdditionalPropsEnumTypeChangeListener(schema);
      // Setup listeners for existing properties
      const props = this.forms.getProperties(this.forms.schemaGroups.indexOf(schema));
      for (const prop of props.controls) {
        this.setupPropertyEnumTypeChangeListener(prop as FormGroup);
      }
    }
  }

  /**
   * Setup listener to clear enum values when primitive type changes.
   * This prevents invalid enum values (e.g., "red, blue" for integer type).
   */
  private setupEnumTypeChangeListener(schema: FormGroup): void {
    schema.get('type')?.valueChanges.subscribe(() => {
      const formatControl = schema.get('format');
      const enumControl = schema.get('enumValues');
      if (formatControl?.value === 'enum') {
        enumControl?.setValue('');
        enumControl?.markAsTouched();
      }
    });
  }

  /**
   * Setup listener to clear enum values when property type changes.
   * This prevents invalid enum values (e.g., "red, blue" for integer type).
   */
  private setupPropertyEnumTypeChangeListener(property: FormGroup): void {
    property.get('type')?.valueChanges.subscribe(() => {
      const formatControl = property.get('format');
      const enumControl = property.get('enumValues');
      if (formatControl?.value === 'enum') {
        enumControl?.setValue('');
        enumControl?.markAsTouched();
      }
    });
  }

  /**
   * Setup listener to clear enum values when additionalProps type changes.
   */
  private setupAdditionalPropsEnumTypeChangeListener(schema: FormGroup): void {
    schema.get('additionalPropsType')?.valueChanges.subscribe(() => {
      const formatControl = schema.get('additionalPropsFormat');
      const enumControl = schema.get('additionalPropsEnum');
      if (formatControl?.value === 'enum') {
        enumControl?.setValue('');
        enumControl?.markAsTouched();
      }
    });
  }

  /**
   * Check if enum field should be shown (when format === 'enum').
   */
  isEnumFormat(format: string | null | undefined): boolean {
    return format === 'enum';
  }

  /**
   * Returns true if any property in a schema has format === 'enum'.
   * Used to conditionally show the Enum column header and grid.
   */
  hasAnyEnumFormat(schemaIndex: number): boolean {
    return this.forms.getPropertyGroups(schemaIndex).some(
      prop => prop.get('format')?.value === 'enum'
    );
  }

  /**
   * Wrapper for adding schema with enum listener setup.
   */
  addSchema(): void {
    this.forms.addSchema();
    const newSchema = this.forms.schemaGroups[this.forms.schemaGroups.length - 1];
    this.setupEnumTypeChangeListener(newSchema);
    this.setupAdditionalPropsEnumTypeChangeListener(newSchema);
  }

  /**
   * Wrapper for adding property with enum listener setup.
   */
  addProperty(schemaIndex: number): void {
    this.forms.addProperty(schemaIndex);
    const props = this.forms.getProperties(schemaIndex);
    const newProp = props.at(props.length - 1) as FormGroup;
    this.setupPropertyEnumTypeChangeListener(newProp);
  }

  getKind(index: number): string {
    return this.forms.schemasForm.at(index).get('kind')?.value ?? 'object';
  }

  getPrimitiveType(index: number): string {
    return this.forms.schemasForm.at(index).get('type')?.value ?? 'string';
  }

  getItemsKind(index: number): string {
    return this.forms.schemasForm.at(index).get('itemsKind')?.value ?? '$ref';
  }

  getFormatsForType(type: string): string[] {
    if (type === 'string') return this.stringFormats;
    if (type === 'number' || type === 'integer') return this.numberFormats;
    return [];
  }

  isRefType(type: string): boolean {
    return type === '$ref' || type === '$ref[]' || type === 'not';
  }

  isComposedType(type: string): boolean {
    return type === 'allOf' || type === 'oneOf' || type === 'anyOf';
  }

  getPropType(schemaIndex: number, propIndex: number): string {
    return this.forms.getProperties(schemaIndex).at(propIndex).get('type')?.value ?? 'string';
  }

  getPropFormat(schemaIndex: number, propIndex: number): string {
    return this.forms.getProperties(schemaIndex).at(propIndex).get('format')?.value ?? '';
  }

  getBadgeClass(kind: string): string {
    return this.kindBadgeClasses[kind] ?? 'bg-badge-slate-bg text-badge-slate-text';
  }

  isNumericType(type: string): boolean {
    return type === 'number' || type === 'integer';
  }

  isStringType(type: string): boolean {
    return type === 'string';
  }

  hasPropConstraints(schI: number, propI: number): boolean {
    const type = this.getPropType(schI, propI);
    return type === 'string' || type === 'integer' || type === 'number' || type.endsWith('[]');
  }

  openConstraintsModal(schI: number, propI: number): void {
    this.constraintModal = { schI, propI };
  }

  closeConstraintsModal(): void {
    this.constraintModal = null;
  }
}
