import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from '../../layout/main/main.component';
import { PanelComponent } from '../../components/panel/panel.component';
import { ButtonComponent } from '../../components/button/button.component';
import { OpenApiFormsService } from '../../services/open-api-forms.service';
import { OpenApiStateService } from '../../services/open-api-state.service';

@Component({
  selector: 'app-schemas',
  imports: [MainComponent, PanelComponent, ReactiveFormsModule, ButtonComponent],
  templateUrl: './schemas.component.html',
  styleUrl: './schemas.component.scss',
})
export class SchemasComponent {
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
  readonly stringFormats = ['', 'date', 'date-time', 'email', 'uri', 'uuid', 'password'];
  readonly numberFormats = ['', 'float', 'double', 'int32', 'int64'];
  readonly propertyTypes = [
    'string', 'integer', 'number', 'boolean',
    '$ref',
    'string[]', 'integer[]', 'number[]', 'boolean[]',
    '$ref[]',
    'allOf', 'oneOf', 'anyOf', 'not',
  ];

  constructor(public forms: OpenApiFormsService, public state: OpenApiStateService) {}

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
}
