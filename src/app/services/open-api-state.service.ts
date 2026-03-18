import { Injectable, signal } from '@angular/core';
import { OpenApiFormsService } from './open-api-forms.service';
import { TagFormValue, SchemeFormValue, SchemaFormValue } from '../models/forms.models';

@Injectable({ providedIn: 'root' })
export class OpenApiStateService {
  tagNames = signal<string[]>([]);
  schemeNames = signal<string[]>([]);
  schemaNames = signal<string[]>([]);

  constructor(private forms: OpenApiFormsService) {
    forms.tagsForm.valueChanges.subscribe((values: TagFormValue[]) => {
      this.tagNames.set(values.map(t => t.name).filter(Boolean));
    });
    forms.schemesForm.valueChanges.subscribe((values: SchemeFormValue[]) => {
      this.schemeNames.set(values.map(s => s.schemeName).filter(Boolean));
    });
    forms.schemasForm.valueChanges.subscribe((values: SchemaFormValue[]) => {
      this.schemaNames.set(values.map(s => s.name).filter(Boolean));
    });
  }

  getSchemaNamesExcluding(schemaIndex: number): string[] {
    const current = this.forms.schemasForm.at(schemaIndex).get('name')?.value;
    return this.schemaNames().filter(n => n !== current);
  }
}
