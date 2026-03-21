import { Injectable } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { load as yamlLoad } from 'js-yaml';

import { OpenApiFormsService } from './open-api-forms.service';
import {
  OpenApiSpec,
  OpenApiSchemaObject,
  OpenApiPrimitiveSchema,
  OpenApiArraySchema,
  OpenApiObjectSchema,
  OpenApiSecurityScheme,
  OpenApiOperation,
  OpenApiParameter,
} from '../models/open-api.models';
import { PropertyFormValue } from '../models/forms.models';

@Injectable({ providedIn: 'root' })
export class OpenApiImportService {
  private static readonly VALID_METHODS = new Set([
    'get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace',
  ]);

  constructor(private readonly forms: OpenApiFormsService) {}

  // ── Public API ──────────────────────────────────────────────────────────────

  importFromString(content: string, filename: string): void {
    const spec = this.parseSpec(content, filename);
    this.validateSpec(spec);
    this.populateForms(spec);
  }

  // ── Parsing & validation ────────────────────────────────────────────────────

  private parseSpec(content: string, filename: string): OpenApiSpec {
    const lower = filename.toLowerCase();
    try {
      if (lower.endsWith('.yaml') || lower.endsWith('.yml')) {
        return yamlLoad(content) as OpenApiSpec;
      }
      if (lower.endsWith('.json')) {
        return JSON.parse(content) as OpenApiSpec;
      }
      // Try JSON first, then YAML for unknown extensions
      try {
        return JSON.parse(content) as OpenApiSpec;
      } catch {
        return yamlLoad(content) as OpenApiSpec;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`No se pudo leer el fichero: ${message}`);
    }
  }

  private validateSpec(spec: unknown): asserts spec is OpenApiSpec {
    if (!spec || typeof spec !== 'object') {
      throw new Error('El fichero no contiene un objeto válido.');
    }
    const obj = spec as Record<string, unknown>;
    if (!obj['openapi'] || !obj['info']) {
      throw new Error('No parece un documento OpenAPI válido (faltan los campos "openapi" e "info").');
    }
  }

  // ── Form population ─────────────────────────────────────────────────────────

  private populateForms(spec: OpenApiSpec): void {
    this.flattenInlineSchemas(spec);
    this.populateApiInfo(spec);
    this.populateServers(spec);
    this.populateTags(spec);
    this.populateSchemas(spec);
    this.populateSecuritySchemes(spec);
    this.populatePaths(spec);
  }

  // ── Inline schema flattening ─────────────────────────────────────────────────

  /**
   * Mutates spec in-place: extracts inline object schemas from properties into
   * top-level schemas with dot-notation names (e.g. User.address.city).
   * Also extracts inline schemas from path requestBody and responses.
   * Must be called before populateSchemas so all schemas are already refs.
   */
  private flattenInlineSchemas(spec: OpenApiSpec): void {
    if (!spec.components) spec.components = {};
    if (!spec.components.schemas) spec.components.schemas = {};

    const schemas = spec.components.schemas;

    // Process component schemas
    const extraSchemas: Record<string, OpenApiSchemaObject> = {};
    for (const [name, schema] of Object.entries(schemas)) {
      this.extractInlineObjects(name, schema, extraSchemas);
    }
    Object.assign(schemas, extraSchemas);

    // Extract inline schemas from path operations into components.schemas
    for (const [pathStr, pathItem] of Object.entries(spec.paths ?? {})) {
      for (const [method, rawOp] of Object.entries(pathItem)) {
        if (!OpenApiImportService.VALID_METHODS.has(method)) continue;
        const op = rawOp as OpenApiOperation;

        // requestBody inline schemas
        for (const [mimeType, entry] of Object.entries(op.requestBody?.content ?? {})) {
          if (entry.schema && !('$ref' in entry.schema)) {
            const name = this.generatePathSchemaName(pathStr, method, 'Request', null, mimeType);
            schemas[name] = entry.schema;
            entry.schema = { $ref: `#/components/schemas/${name}` };
            const nested: Record<string, OpenApiSchemaObject> = {};
            this.extractInlineObjects(name, schemas[name], nested);
            Object.assign(schemas, nested);
          }
        }

        // response inline schemas
        for (const [statusCode, resp] of Object.entries(op.responses ?? {})) {
          for (const [mimeType, entry] of Object.entries(resp.content ?? {})) {
            if (entry.schema && !('$ref' in entry.schema)) {
              const name = this.generatePathSchemaName(pathStr, method, 'Response', statusCode, mimeType);
              schemas[name] = entry.schema;
              entry.schema = { $ref: `#/components/schemas/${name}` };
              const nested: Record<string, OpenApiSchemaObject> = {};
              this.extractInlineObjects(name, schemas[name], nested);
              Object.assign(schemas, nested);
            }
          }
        }
      }
    }
  }

  /**
   * Generates a PascalCase schema name from path + method + context.
   * e.g. POST /users/{id} → PostUsersIdRequestBody
   */
  private generatePathSchemaName(
    path: string,
    method: string,
    suffix: string,
    statusCode: string | null,
    mimeType: string,
  ): string {
    const pathPart = path
      .split('/')
      .filter(Boolean)
      .map(s => s.replace(/[{}]/g, '').replace(/[^a-zA-Z0-9]/g, '_'))
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');
    const methodPart = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
    const statusPart = statusCode ?? '';
    const mimePart = mimeType.split('/')[1]?.replace(/[^a-zA-Z0-9]/g, '') ?? '';
    const parts = [methodPart, pathPart, suffix, statusPart, mimePart !== 'json' ? mimePart : '']
      .filter(Boolean);
    return parts.join('');
  }

  /**
   * Recursively detects inline object schemas in properties.
   * Bottom-up: recurses into children before registering the current level,
   * so deeper schemas are added to `out` first.
   */
  private extractInlineObjects(
    parentName: string,
    schema: OpenApiSchemaObject,
    out: Record<string, OpenApiSchemaObject>,
  ): void {
    if (!('type' in schema) || schema.type !== 'object') return;
    if (!schema.properties) return;

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (!('type' in propSchema) || propSchema.type !== 'object') continue;

      const fullName = `${parentName}.${propName}`;

      // Recurse first → children extracted before parent (bottom-up)
      this.extractInlineObjects(fullName, propSchema, out);

      out[fullName] = propSchema;
      schema.properties[propName] = { $ref: `#/components/schemas/${fullName}` };
    }
  }

  // ── API Info ────────────────────────────────────────────────────────────────

  private populateApiInfo(spec: OpenApiSpec): void {
    this.forms.apiInfoForm.patchValue({
      title: spec.info.title ?? '',
      version: spec.info.version ?? '',
      description: spec.info.description ?? '',
      contactEmail: spec.info.contact?.email ?? '',
      contactName: spec.info.contact?.name ?? '',
      contactUrl: spec.info.contact?.url ?? '',
      license: spec.info.license?.name ?? '',
      licenseUrl: spec.info.license?.url ?? '',
      externalDocsUrl: spec.externalDocs?.url ?? '',
      externalDocsDescription: spec.externalDocs?.description ?? '',
    });
  }

  // ── Servers ─────────────────────────────────────────────────────────────────

  private populateServers(spec: OpenApiSpec): void {
    const servers = spec.servers ?? [];
    this.rebuildFormArray(
      this.forms.serversForm,
      servers,
      (server) => {
        const desc = server.description ?? '';
        const separatorIndex = desc.indexOf(' – ');
        const entorno = separatorIndex !== -1 ? desc.slice(0, separatorIndex) : '';
        const descripcion = separatorIndex !== -1 ? desc.slice(separatorIndex + 3) : desc;
        const group = this.callPrivate('createServer');
        group.patchValue({ url: server.url ?? '', entorno, descripcion });
        return group;
      },
      () => this.callPrivate('createServer'),
    );
  }

  // ── Tags ────────────────────────────────────────────────────────────────────

  private populateTags(spec: OpenApiSpec): void {
    const tags = spec.tags ?? [];
    this.rebuildFormArray(
      this.forms.tagsForm,
      tags,
      (tag) => {
        const group = this.callPrivate('createTag');
        group.patchValue({
          name: tag.name ?? '',
          description: tag.description ?? '',
          externalDocsUrl: tag.externalDocs?.url ?? '',
        });
        return group;
      },
      () => this.callPrivate('createTag'),
    );
  }

  // ── Schemas ─────────────────────────────────────────────────────────────────

  private populateSchemas(spec: OpenApiSpec): void {
    const schemas = Object.entries(spec.components?.schemas ?? {});
    this.rebuildFormArray(
      this.forms.schemasForm,
      schemas,
      ([name, schema]) => {
        const group = this.callPrivate('createSchema');
        const formValue = this.mapSchema(name, schema);
        group.patchValue(formValue);

        // Rebuild properties FormArray for object schemas
        const propsArray = group.get('properties') as FormArray;
        propsArray.clear();
        for (const prop of (formValue['properties'] as PropertyFormValue[]) ?? []) {
          const propGroup = this.forms.createProperty();
          propGroup.patchValue(prop);
          propsArray.push(propGroup);
        }

        return group;
      },
      () => this.callPrivate('createSchema'),
    );
  }

  private mapSchema(name: string, schema: OpenApiSchemaObject): Record<string, unknown> {
    const base: Record<string, unknown> = {
      name,
      title: ('title' in schema ? (schema as { title?: string }).title : '') ?? '',
      description: ('description' in schema ? schema.description : '') ?? '',
      properties: [],
      additionalPropsEnabled: false,
      additionalPropsType: 'string',
      additionalPropsFormat: '',
      additionalPropsRef: '',
      additionalPropsComposed: [],
      additionalPropsEnum: '',
      itemsKind: '$ref',
      itemsType: 'string',
      itemsRef: '',
      refSchema: '',
      composedSchemas: [],
      type: 'string',
      format: '',
      example: '',
      enumValues: '',
      default: '',
      minimum: '', maximum: '', exclusiveMinimum: false, exclusiveMaximum: false, multipleOf: '',
      minLength: '', maxLength: '', pattern: '',
      minItems: '', maxItems: '', uniqueItems: false,
      deprecated: false,
    };

    if ('$ref' in schema) {
      return { ...base, kind: '$ref', refSchema: this.extractSchemaName(schema.$ref) };
    }
    if ('not' in schema) {
      const notRef = schema.not;
      return { ...base, kind: 'not', refSchema: '$ref' in notRef ? this.extractSchemaName(notRef.$ref) : '' };
    }
    if ('allOf' in schema) {
      return { ...base, kind: 'allOf', composedSchemas: this.extractComposedRefs(schema.allOf ?? []) };
    }
    if ('oneOf' in schema) {
      return { ...base, kind: 'oneOf', composedSchemas: this.extractComposedRefs(schema.oneOf ?? []) };
    }
    if ('anyOf' in schema) {
      return { ...base, kind: 'anyOf', composedSchemas: this.extractComposedRefs(schema.anyOf ?? []) };
    }
    if ('type' in schema) {
      if (schema.type === 'object') {
        const objSchema = schema as OpenApiObjectSchema;
        const requiredSet = new Set(objSchema.required ?? []);
        const properties = Object.entries(objSchema.properties ?? {}).map(
          ([propName, propSchema]) => this.mapProperty(propName, propSchema, requiredSet.has(propName)),
        );
        const addlProps = this.mapAdditionalProperties(objSchema.additionalProperties);
        return {
          ...base, kind: 'object', properties, ...addlProps,
          deprecated: objSchema.deprecated ?? false,
        };
      }
      if (schema.type === 'array') {
        const arrSchema = schema as OpenApiArraySchema;
        const arrFields = {
          minItems: arrSchema.minItems !== undefined ? String(arrSchema.minItems) : '',
          maxItems: arrSchema.maxItems !== undefined ? String(arrSchema.maxItems) : '',
          uniqueItems: arrSchema.uniqueItems ?? false,
          deprecated: arrSchema.deprecated ?? false,
        };
        const items = arrSchema.items;
        if (items && '$ref' in items) {
          return { ...base, kind: 'array', itemsKind: '$ref', itemsRef: this.extractSchemaName(items.$ref), ...arrFields };
        }
        if (items && 'type' in items) {
          return { ...base, kind: 'array', itemsKind: 'primitive', itemsType: (items as OpenApiPrimitiveSchema).type, ...arrFields };
        }
        return { ...base, kind: 'array', ...arrFields };
      }
      // Primitive — safe cast: object and array branches already returned above
      const primitive = schema as OpenApiPrimitiveSchema;
      const primitiveResult: Record<string, unknown> = {
        ...base,
        kind: 'primitive',
        type: primitive.type,
        format: primitive.format ?? '',
        example: primitive.example ?? '',
        default: primitive.default !== undefined ? String(primitive.default) : '',
        minimum: primitive.minimum !== undefined ? String(primitive.minimum) : '',
        maximum: primitive.maximum !== undefined ? String(primitive.maximum) : '',
        exclusiveMinimum: primitive.exclusiveMinimum ?? false,
        exclusiveMaximum: primitive.exclusiveMaximum ?? false,
        multipleOf: primitive.multipleOf !== undefined ? String(primitive.multipleOf) : '',
        minLength: primitive.minLength !== undefined ? String(primitive.minLength) : '',
        maxLength: primitive.maxLength !== undefined ? String(primitive.maxLength) : '',
        pattern: primitive.pattern ?? '',
        deprecated: primitive.deprecated ?? false,
      };
      if (primitive.enum?.length) {
        primitiveResult['format'] = 'enum';
        primitiveResult['enumValues'] = (primitive.enum as Array<string | number | boolean>).join(', ');
      }
      return primitiveResult;
    }

    return { ...base, kind: 'primitive' };
  }

  private mapProperty(propName: string, schema: OpenApiSchemaObject, required = false): PropertyFormValue {
    const base: PropertyFormValue = {
      name: propName,
      type: 'string',
      format: '',
      refSchema: '',
      composedSchemas: [],
      required,
      enumValues: '',
      default: '',
      minimum: '', maximum: '', exclusiveMinimum: false, exclusiveMaximum: false, multipleOf: '',
      minLength: '', maxLength: '', pattern: '',
      minItems: '', maxItems: '', uniqueItems: false,
      deprecated: false,
    };

    if ('$ref' in schema) {
      return { ...base, type: '$ref', refSchema: this.extractSchemaName(schema.$ref) };
    }
    if ('not' in schema) {
      const notRef = schema.not;
      return { ...base, type: 'not', refSchema: '$ref' in notRef ? this.extractSchemaName(notRef.$ref) : '' };
    }
    if ('allOf' in schema) {
      return { ...base, type: 'allOf', composedSchemas: this.extractComposedRefs(schema.allOf ?? []) };
    }
    if ('oneOf' in schema) {
      return { ...base, type: 'oneOf', composedSchemas: this.extractComposedRefs(schema.oneOf ?? []) };
    }
    if ('anyOf' in schema) {
      return { ...base, type: 'anyOf', composedSchemas: this.extractComposedRefs(schema.anyOf ?? []) };
    }
    if ('type' in schema) {
      if (schema.type === 'array') {
        const arrSchema = schema as OpenApiArraySchema;
        const arrFields = {
          minItems: arrSchema.minItems !== undefined ? String(arrSchema.minItems) : '',
          maxItems: arrSchema.maxItems !== undefined ? String(arrSchema.maxItems) : '',
          uniqueItems: arrSchema.uniqueItems ?? false,
          deprecated: arrSchema.deprecated ?? false,
        };
        const items = arrSchema.items;
        if ('$ref' in items) {
          return { ...base, type: '$ref[]', refSchema: this.extractSchemaName(items.$ref), ...arrFields };
        }
        if ('type' in items) {
          // Safe cast: array items are never object/array in our model
          const primitiveItems = items as OpenApiPrimitiveSchema;
          const itemType = `${primitiveItems.type}[]`;
          const result: PropertyFormValue = { ...base, type: itemType, ...arrFields };
          if (primitiveItems.format) result.format = primitiveItems.format;
          if (primitiveItems.enum?.length) {
            result.format = 'enum';
            result.enumValues = (primitiveItems.enum as Array<string | number | boolean>).join(', ');
          }
          return result;
        }
        return { ...base, ...arrFields };
      }
      // Primitive — safe cast: array branch already returned above
      const primitive = schema as OpenApiPrimitiveSchema;
      const result: PropertyFormValue = {
        ...base, type: primitive.type, format: primitive.format ?? '',
        minimum: primitive.minimum !== undefined ? String(primitive.minimum) : '',
        maximum: primitive.maximum !== undefined ? String(primitive.maximum) : '',
        exclusiveMinimum: primitive.exclusiveMinimum ?? false,
        exclusiveMaximum: primitive.exclusiveMaximum ?? false,
        multipleOf: primitive.multipleOf !== undefined ? String(primitive.multipleOf) : '',
        minLength: primitive.minLength !== undefined ? String(primitive.minLength) : '',
        maxLength: primitive.maxLength !== undefined ? String(primitive.maxLength) : '',
        pattern: primitive.pattern ?? '',
        deprecated: primitive.deprecated ?? false,
      };
      if (primitive.enum?.length) {
        result.format = 'enum';
        result.enumValues = (primitive.enum as Array<string | number | boolean>).join(', ');
      }
      if (primitive.default !== undefined) result.default = String(primitive.default);
      return result;
    }

    return base;
  }

  private mapAdditionalProperties(
    addlProps: false | OpenApiSchemaObject | undefined,
  ): Record<string, unknown> {
    if (addlProps === undefined) return {};
    if (addlProps === false) return { additionalPropsEnabled: false };

    const prop = this.mapProperty('', addlProps);
    return {
      additionalPropsEnabled: true,
      additionalPropsType: prop.type,
      additionalPropsFormat: prop.format,
      additionalPropsRef: prop.refSchema,
      additionalPropsComposed: prop.composedSchemas,
      additionalPropsEnum: prop.enumValues,
    };
  }

  // ── Security schemes ────────────────────────────────────────────────────────

  private populateSecuritySchemes(spec: OpenApiSpec): void {
    const schemes = Object.entries(spec.components?.securitySchemes ?? {});
    this.rebuildFormArray(
      this.forms.schemesForm,
      schemes,
      ([schemeName, scheme]) => {
        const group = this.callPrivate('createScheme');
        group.patchValue(this.mapScheme(schemeName, scheme));
        return group;
      },
      () => this.callPrivate('createScheme'),
    );
  }

  private mapScheme(schemeName: string, scheme: OpenApiSecurityScheme): Record<string, unknown> {
    const base = {
      schemeName,
      type: scheme.type,
      description: scheme.description ?? '',
      paramName: '',
      in: 'header',
      scheme: 'bearer',
      bearerFormat: '',
      oauthFlow: 'authorizationCode',
      authorizationUrl: '',
      tokenUrl: '',
      scopes: '',
      openIdConnectUrl: '',
    };

    switch (scheme.type) {
      case 'apiKey':
        return { ...base, paramName: scheme.name ?? '', in: scheme.in ?? 'header' };
      case 'http':
        return { ...base, scheme: scheme.scheme ?? 'bearer', bearerFormat: scheme.bearerFormat ?? '' };
      case 'oauth2': {
        const flows = scheme.flows ?? {};
        if (flows.implicit) {
          const scopes = Object.keys(flows.implicit.scopes ?? {}).join(' ');
          return { ...base, oauthFlow: 'implicit', authorizationUrl: flows.implicit.authorizationUrl ?? '', scopes };
        }
        if (flows.password) {
          const scopes = Object.keys(flows.password.scopes ?? {}).join(' ');
          return { ...base, oauthFlow: 'password', tokenUrl: flows.password.tokenUrl ?? '', scopes };
        }
        if (flows.clientCredentials) {
          const scopes = Object.keys(flows.clientCredentials.scopes ?? {}).join(' ');
          return { ...base, oauthFlow: 'clientCredentials', tokenUrl: flows.clientCredentials.tokenUrl ?? '', scopes };
        }
        const flow = flows.authorizationCode;
        const scopes = Object.keys(flow?.scopes ?? {}).join(' ');
        return { ...base, oauthFlow: 'authorizationCode', authorizationUrl: flow?.authorizationUrl ?? '', tokenUrl: flow?.tokenUrl ?? '', scopes };
      }
      case 'openIdConnect':
        return { ...base, openIdConnectUrl: scheme.openIdConnectUrl ?? '' };
    }
  }

  // ── Paths ───────────────────────────────────────────────────────────────────

  /**
   * Resolves a parameter that may be a direct object or a $ref to components/parameters.
   * Returns null if the ref cannot be resolved.
   */
  private resolveParameter(
    param: OpenApiParameter | { $ref: string },
    spec: OpenApiSpec,
  ): OpenApiParameter | null {
    if (!('$ref' in param)) return param;
    const name = (param as { $ref: string }).$ref.replace('#/components/parameters/', '');
    const componentParams = (spec.components as Record<string, unknown> | undefined)?.['parameters'];
    if (componentParams && typeof componentParams === 'object') {
      return (componentParams as Record<string, OpenApiParameter>)[name] ?? null;
    }
    return null;
  }

  private populatePaths(spec: OpenApiSpec): void {
    const endpoints: Array<{ path: string; method: string; operation: OpenApiOperation }> = [];
    for (const [pathStr, pathItem] of Object.entries(spec.paths ?? {})) {
      // Path-level parameters: resolve any $ref entries against components/parameters.
      const rawPathLevelParams =
        ((pathItem as Record<string, unknown>)['parameters'] as Array<OpenApiParameter | { $ref: string }> | undefined) ?? [];
      const pathLevelParams: OpenApiParameter[] = rawPathLevelParams
        .map(p => this.resolveParameter(p, spec))
        .filter((p): p is OpenApiParameter => p !== null);

      for (const [method, rawOp] of Object.entries(pathItem)) {
        // Skip non-method fields: parameters, summary, description, servers, externalDocs
        if (!OpenApiImportService.VALID_METHODS.has(method)) continue;

        const operation = rawOp as OpenApiOperation;

        // Operation-level parameters: also resolve $ref entries.
        const rawOpParams = (operation.parameters ?? []) as Array<OpenApiParameter | { $ref: string }>;
        const opParams: OpenApiParameter[] = rawOpParams
          .map(p => this.resolveParameter(p, spec))
          .filter((p): p is OpenApiParameter => p !== null);

        // Merge path-level and operation-level params.
        // Operation-level params override path-level ones with the same name+in.
        const mergedParams: OpenApiParameter[] = [
          ...pathLevelParams.filter(
            pp => !opParams.some(op => op.name === pp.name && op.in === pp.in),
          ),
          ...opParams,
        ];

        endpoints.push({ path: pathStr, method, operation: { ...operation, parameters: mergedParams } });
      }
    }

    this.rebuildFormArray(
      this.forms.pathsForm,
      endpoints,
      ({ path, method, operation }) => {
        const group = this.callPrivate('createPath');
        const params = (operation.parameters ?? []) as OpenApiParameter[];

        const pathParams = params
          .filter(p => p.in === 'path')
          .map(p => ({ name: p.name, type: p.schema?.type ?? 'string', description: p.description ?? '' }));

        const queryParams = params
          .filter(p => p.in === 'query')
          .map(p => {
            const style = p.style ?? 'form';
            const defaultExplode = style === 'form';
            return {
              name: p.name,
              type: p.schema?.type ?? 'string',
              required: !!p.required,
              description: p.description ?? '',
              default: p.schema?.default !== undefined ? String(p.schema.default) : '',
              style,
              explode: p.explode !== undefined ? p.explode : defaultExplode,
              allowEmptyValue: p.allowEmptyValue ?? false,
            };
          });

        const requestBody = Object.entries(operation.requestBody?.content ?? {}).map(
          ([mimeType, entry]) => ({
            mimeType,
            schema: entry.schema && '$ref' in entry.schema ? this.extractSchemaName((entry.schema as { $ref: string }).$ref) : '',
          }),
        );

        const responses = Object.entries(operation.responses ?? {}).map(([statusCode, resp]) => ({
          statusCode,
          description: resp.description ?? '',
          contents: Object.entries(resp.content ?? {}).map(([mimeType, entry]) => ({
            mimeType,
            schema: entry.schema && '$ref' in entry.schema ? this.extractSchemaName((entry.schema as { $ref: string }).$ref) : '',
          })),
        }));

        const security = (operation.security ?? []).flatMap(s => Object.keys(s));
        const tags = operation.tags ?? [];

        group.patchValue({
          path,
          method,
          operationId: operation.operationId ?? '',
          summary: operation.summary ?? '',
          description: operation.description ?? '',
          tags,
          security,
          requestBodyRequired: operation.requestBody?.required ?? false,
          requestBodyDescription: (operation.requestBody as { description?: string } | undefined)?.description ?? '',
        });

        // Rebuild nested FormArrays
        const pathParamsArray = group.get('pathParams') as FormArray;
        pathParamsArray.clear();
        pathParams.forEach(p => {
          const g = this.forms.createPathParam(p.name);
          g.patchValue(p);
          pathParamsArray.push(g);
        });

        const queryParamsArray = group.get('queryParams') as FormArray;
        queryParamsArray.clear();
        queryParams.forEach(p => {
          const g = this.forms.createQueryParam();
          g.patchValue(p);
          queryParamsArray.push(g);
        });

        const requestBodyArray = group.get('requestBody') as FormArray;
        requestBodyArray.clear();
        requestBody.forEach(rb => {
          const g = this.forms.createRequestBodyContent();
          g.patchValue(rb);
          requestBodyArray.push(g);
        });

        const responsesArray = group.get('responses') as FormArray;
        responsesArray.clear();
        responses.forEach(resp => {
          const respGroup = this.forms.createResponse();
          respGroup.patchValue({ statusCode: resp.statusCode, description: resp.description });
          const contentsArray = respGroup.get('contents') as FormArray;
          contentsArray.clear();
          resp.contents.forEach(c => {
            const cg = this.forms.createResponseContent();
            cg.patchValue(c);
            contentsArray.push(cg);
          });
          responsesArray.push(respGroup);
        });

        return group;
      },
      () => this.callPrivate('createPath'),
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private extractSchemaName(ref: string): string {
    return ref.replace('#/components/schemas/', '');
  }

  private extractComposedRefs(schemas: OpenApiSchemaObject[]): string[] {
    return schemas
      .filter(s => '$ref' in s)
      .map(s => this.extractSchemaName((s as { $ref: string }).$ref));
  }

  private rebuildFormArray<T>(
    formArray: FormArray,
    items: T[],
    factory: (item: T) => FormGroup,
    emptyFactory: () => FormGroup,
  ): void {
    formArray.clear();
    if (items.length === 0) {
      formArray.push(emptyFactory());
    } else {
      items.forEach(item => formArray.push(factory(item)));
    }
  }

  /**
   * Calls a private factory method on OpenApiFormsService by name.
   * These methods are private in the service but we need them to create
   * pre-configured FormGroups with the correct validators.
   */
  private callPrivate(method: string): FormGroup {
    return (this.forms as unknown as Record<string, () => FormGroup>)[method]();
  }
}
