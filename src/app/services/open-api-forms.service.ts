import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class OpenApiFormsService {
  readonly apiInfoForm: FormGroup;
  readonly serversForm: FormArray;
  readonly tagsForm: FormArray;
  readonly schemesForm: FormArray;
  readonly schemasForm: FormArray;
  readonly pathsForm: FormArray;

  constructor(private fb: FormBuilder) {
    this.apiInfoForm = this.fb.group({
      title: [''],
      version: [''],
      description: [''],
      contactEmail: [''],
      license: [''],
    });

    this.serversForm = this.fb.array([this.createServer()]);
    this.tagsForm = this.fb.array([this.createTag()]);
    this.schemesForm = this.fb.array([this.createScheme()]);
    this.schemasForm = this.fb.array([this.createSchema()]);
    this.pathsForm = this.fb.array([this.createPath()]);
  }

  // ── Servers ───────────────────────────────────────────────────────────────
  private createServer(): FormGroup {
    return this.fb.group({ url: [''], entorno: [''], descripcion: [''] });
  }
  get serverGroups(): FormGroup[] { return this.serversForm.controls as FormGroup[]; }
  addServer() { this.serversForm.push(this.createServer()); }
  removeServer(i: number) { this.serversForm.removeAt(i); }

  // ── Tags ──────────────────────────────────────────────────────────────────
  private createTag(): FormGroup {
    return this.fb.group({ name: [''], externalDocsUrl: [''], description: [''] });
  }
  get tagGroups(): FormGroup[] { return this.tagsForm.controls as FormGroup[]; }
  addTag() { this.tagsForm.push(this.createTag()); }
  removeTag(i: number) { this.tagsForm.removeAt(i); }

  // ── Security ──────────────────────────────────────────────────────────────
  private createScheme(): FormGroup {
    return this.fb.group({
      schemeName: [''], type: ['apiKey'], description: [''],
      paramName: [''], in: ['header'],
      scheme: ['bearer'], bearerFormat: [''],
      authorizationUrl: [''], tokenUrl: [''], scopes: [''],
      openIdConnectUrl: [''],
    });
  }
  get schemeGroups(): FormGroup[] { return this.schemesForm.controls as FormGroup[]; }
  addScheme() { this.schemesForm.push(this.createScheme()); }
  removeScheme(i: number) { this.schemesForm.removeAt(i); }

  // ── Schemas ───────────────────────────────────────────────────────────────
  createProperty(): FormGroup {
    return this.fb.group({
      name: [''], type: ['string'], format: [''],
      refSchema: [''], composedSchemas: [[]], required: [false],
    });
  }

  createSchema(): FormGroup {
    return this.fb.group({
      name: [''], kind: ['object'], description: [''],
      type: ['string'], format: [''], example: [''],
      properties: this.fb.array([]),
      itemsKind: ['$ref'], itemsType: ['string'], itemsRef: [''],
      refSchema: [''], composedSchemas: [[]],
    });
  }
  get schemaGroups(): FormGroup[] { return this.schemasForm.controls as FormGroup[]; }
  addSchema() { this.schemasForm.push(this.createSchema()); }
  removeSchema(i: number) { this.schemasForm.removeAt(i); }

  getProperties(schemaIndex: number): FormArray {
    return this.schemasForm.at(schemaIndex).get('properties') as FormArray;
  }
  getPropertyGroups(schemaIndex: number): FormGroup[] {
    return this.getProperties(schemaIndex).controls as FormGroup[];
  }
  addProperty(schemaIndex: number) {
    this.getProperties(schemaIndex).push(this.createProperty());
  }
  removeProperty(schemaIndex: number, propIndex: number) {
    this.getProperties(schemaIndex).removeAt(propIndex);
  }

  // ── Paths ─────────────────────────────────────────────────────────────────
  private createPath(): FormGroup {
    return this.fb.group({
      path: [''], method: ['get'], operationId: [''], summary: [''],
      tags: [[]], security: [[]], description: [''],
      requestBody: this.fb.array([]),
      queryParams: this.fb.array([]),
      pathParams: this.fb.array([]),
      responses: this.fb.array([]),
    });
  }
  get pathGroups(): FormGroup[] { return this.pathsForm.controls as FormGroup[]; }
  addPath() { this.pathsForm.push(this.createPath()); }
  removePath(i: number) { this.pathsForm.removeAt(i); }

  createRequestBodyContent(): FormGroup {
    return this.fb.group({ mimeType: ['application/json'], schema: [''] });
  }
  getRequestBody(pathIndex: number): FormArray {
    return this.pathsForm.at(pathIndex).get('requestBody') as FormArray;
  }
  getRequestBodyGroups(pathIndex: number): FormGroup[] {
    return this.getRequestBody(pathIndex).controls as FormGroup[];
  }
  addRequestBodyContent(pathIndex: number) { this.getRequestBody(pathIndex).push(this.createRequestBodyContent()); }
  removeRequestBodyContent(pathIndex: number, contentIndex: number) { this.getRequestBody(pathIndex).removeAt(contentIndex); }

  createQueryParam(): FormGroup {
    return this.fb.group({ name: [''], type: ['string'], required: [false], description: [''] });
  }
  getQueryParams(pathIndex: number): FormArray {
    return this.pathsForm.at(pathIndex).get('queryParams') as FormArray;
  }
  getQueryParamGroups(pathIndex: number): FormGroup[] {
    return this.getQueryParams(pathIndex).controls as FormGroup[];
  }
  addQueryParam(pathIndex: number) { this.getQueryParams(pathIndex).push(this.createQueryParam()); }
  removeQueryParam(pathIndex: number, paramIndex: number) { this.getQueryParams(pathIndex).removeAt(paramIndex); }

  createPathParam(name: string): FormGroup {
    return this.fb.group({ name: [name], type: ['string'], description: [''] });
  }
  getPathParams(pathIndex: number): FormArray {
    return this.pathsForm.at(pathIndex).get('pathParams') as FormArray;
  }
  getPathParamGroups(pathIndex: number): FormGroup[] {
    return this.getPathParams(pathIndex).controls as FormGroup[];
  }
  syncPathParams(pathIndex: number, names: string[]) {
    const fa = this.getPathParams(pathIndex);
    for (let i = fa.length - 1; i >= 0; i--) {
      if (!names.includes(fa.at(i).get('name')?.value)) fa.removeAt(i);
    }
    const existing = fa.controls.map(c => c.get('name')?.value);
    names.filter(n => !existing.includes(n)).forEach(n => fa.push(this.createPathParam(n)));
  }

  createResponse(): FormGroup {
    return this.fb.group({ statusCode: ['200'], description: [''], contents: this.fb.array([]) });
  }
  getResponses(pathIndex: number): FormArray {
    return this.pathsForm.at(pathIndex).get('responses') as FormArray;
  }
  getResponseGroups(pathIndex: number): FormGroup[] {
    return this.getResponses(pathIndex).controls as FormGroup[];
  }
  addResponse(pathIndex: number) { this.getResponses(pathIndex).push(this.createResponse()); }
  removeResponse(pathIndex: number, responseIndex: number) { this.getResponses(pathIndex).removeAt(responseIndex); }

  isStatusCodeDuplicate(pathIndex: number, respIndex: number): boolean {
    const groups = this.getResponseGroups(pathIndex);
    const code = groups[respIndex]?.get('statusCode')?.value;
    if (!code) return false;
    return groups.some((g, i) => i !== respIndex && g.get('statusCode')?.value === code);
  }

  createResponseContent(): FormGroup {
    return this.fb.group({ mimeType: ['application/json'], schema: [''] });
  }
  getContents(pathIndex: number, respIndex: number): FormArray {
    return this.getResponses(pathIndex).at(respIndex).get('contents') as FormArray;
  }
  getContentGroups(pathIndex: number, respIndex: number): FormGroup[] {
    return this.getContents(pathIndex, respIndex).controls as FormGroup[];
  }
  addContent(pathIndex: number, respIndex: number) {
    this.getContents(pathIndex, respIndex).push(this.createResponseContent());
  }
  removeContent(pathIndex: number, respIndex: number, contentIndex: number) {
    this.getContents(pathIndex, respIndex).removeAt(contentIndex);
  }
}
