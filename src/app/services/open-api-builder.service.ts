import { Injectable, signal } from '@angular/core';
import { merge } from 'rxjs';
import { dump } from 'js-yaml';

import { OpenApiFormsService } from './open-api-forms.service';
import {
  OpenApiSpec,
  OpenApiInfo,
  OpenApiServer,
  OpenApiTag,
  OpenApiPathItem,
  OpenApiOperation,
  OpenApiParameter,
  OpenApiRequestBody,
  OpenApiResponse,
  OpenApiComponents,
  OpenApiSchemaObject,
  OpenApiObjectSchema,
  OpenApiPrimitiveSchema,
  OpenApiArraySchema,
  OpenApiRefSchema,
  OpenApiComposedSchema,
  OpenApiNotSchema,
  OpenApiSecurityScheme,
  OpenApiOAuth2Scheme,
  OpenApiAdditionalProperties,
} from '../models/open-api.models';
import {
  ApiInfoFormValue,
  ServerFormValue,
  TagFormValue,
  SchemeFormValue,
  SchemaFormValue,
  PropertyFormValue,
  PathFormValue,
  PathParamFormValue,
  QueryParamFormValue,
  RequestBodyContentFormValue,
  ResponseFormValue,
} from '../models/forms.models';

@Injectable({ providedIn: 'root' })
export class OpenApiBuilderService {
  readonly spec = signal<OpenApiSpec>({ openapi: '3.0.0', info: { title: '', version: '' } });

  constructor(private readonly forms: OpenApiFormsService) {
    this.spec.set(this.build());
    merge(
      forms.apiInfoForm.valueChanges,
      forms.serversForm.valueChanges,
      forms.tagsForm.valueChanges,
      forms.schemesForm.valueChanges,
      forms.schemasForm.valueChanges,
      forms.pathsForm.valueChanges,
    ).subscribe(() => this.spec.set(this.build()));
  }

  specAsJson(): string {
    return JSON.stringify(this.spec(), null, 2);
  }

  specAsYaml(): string {
    return dump(this.spec(), { lineWidth: -1, noRefs: true });
  }

  // ── Main builder ──────────────────────────────────────────────────────────

  private build(): OpenApiSpec {
    const spec: OpenApiSpec = {
      openapi: '3.0.0',
      info: this.buildInfo(),
    };

    const v = this.forms.apiInfoForm.value as ApiInfoFormValue;
    if (v.externalDocsUrl) {
      spec.externalDocs = { url: v.externalDocsUrl };
      if (v.externalDocsDescription) spec.externalDocs.description = v.externalDocsDescription;
    }

    const servers = this.buildServers();
    if (servers.length) spec.servers = servers;

    const tags = this.buildTags();
    if (tags.length) spec.tags = tags;

    const paths = this.buildPaths();
    if (Object.keys(paths).length) spec.paths = paths;

    const components = this.buildComponents();
    if (Object.keys(components).length) spec.components = components;

    return spec;
  }

  // ── Info ──────────────────────────────────────────────────────────────────

  private buildInfo(): OpenApiInfo {
    const v = this.forms.apiInfoForm.value as ApiInfoFormValue;
    const info: OpenApiInfo = {
      title: v.title || 'API',
      version: v.version || '1.0.0',
    };
    if (v.description) info.description = v.description;
    if (v.contactEmail || v.contactName || v.contactUrl) {
      info.contact = {};
      if (v.contactName) info.contact.name = v.contactName;
      if (v.contactUrl) info.contact.url = v.contactUrl;
      if (v.contactEmail) info.contact.email = v.contactEmail;
    }
    if (v.license) {
      info.license = { name: v.license };
      if (v.licenseUrl) info.license.url = v.licenseUrl;
    }
    return info;
  }

  // ── Servers ───────────────────────────────────────────────────────────────

  private buildServers(): OpenApiServer[] {
    return (this.forms.serversForm.value as ServerFormValue[])
      .filter(s => s.url)
      .map(s => {
        const server: OpenApiServer = { url: s.url };
        const desc = [s.entorno, s.descripcion].filter(Boolean).join(' – ');
        if (desc) server.description = desc;
        return server;
      });
  }

  // ── Tags ──────────────────────────────────────────────────────────────────

  private buildTags(): OpenApiTag[] {
    return (this.forms.tagsForm.value as TagFormValue[])
      .filter(t => t.name)
      .map(t => {
        const tag: OpenApiTag = { name: t.name };
        if (t.description) tag.description = t.description;
        if (t.externalDocsUrl) tag.externalDocs = { url: t.externalDocsUrl };
        return tag;
      });
  }

  // ── Paths ─────────────────────────────────────────────────────────────────

  private buildPaths(): Record<string, OpenApiPathItem> {
    const paths: Record<string, OpenApiPathItem> = {};

    for (const endpoint of this.forms.pathsForm.value as PathFormValue[]) {
      if (!endpoint.path) continue;
      if (!paths[endpoint.path]) paths[endpoint.path] = {};

      const parameters = this.buildParameters(endpoint);
      const operation = this.buildOperation(endpoint, parameters);
      paths[endpoint.path][endpoint.method] = operation;
    }

    return paths;
  }

  private buildParameters(endpoint: PathFormValue): OpenApiParameter[] {
    const pathParams: OpenApiParameter[] = (endpoint.pathParams ?? [])
      .filter((p: PathParamFormValue) => p.name)
      .map((p: PathParamFormValue) => ({
        in: 'path' as const,
        name: p.name,
        required: true,
        schema: { type: (p.type || 'string') as OpenApiPrimitiveSchema['type'] },
        ...(p.description && { description: p.description }),
      }));

    const queryParams: OpenApiParameter[] = (endpoint.queryParams ?? [])
      .filter((p: QueryParamFormValue) => p.name)
      .map((p: QueryParamFormValue) => {
        const schema: OpenApiPrimitiveSchema = { type: (p.type || 'string') as OpenApiPrimitiveSchema['type'] };
        const parsedDefault = this.parseDefaultValue(p.default, p.type || 'string');
        if (parsedDefault !== undefined) schema.default = parsedDefault;
        return {
          in: 'query' as const,
          name: p.name,
          required: !!p.required,
          schema,
          ...(p.description && { description: p.description }),
        };
      });

    return [...pathParams, ...queryParams];
  }

  private static readonly METHODS_WITHOUT_BODY: ReadonlySet<string> = new Set(['get', 'head']);

  private buildOperation(endpoint: PathFormValue, parameters: OpenApiParameter[]): OpenApiOperation {
    const operation: OpenApiOperation = {};
    if (endpoint.operationId) operation.operationId = endpoint.operationId;
    if (endpoint.summary) operation.summary = endpoint.summary;
    if (endpoint.description) operation.description = endpoint.description;
    if (endpoint.tags?.length) operation.tags = endpoint.tags;
    if (endpoint.security?.length) {
      operation.security = endpoint.security.map(s => ({ [s]: [] }));
    }
    if (parameters.length) operation.parameters = parameters;
    if (!OpenApiBuilderService.METHODS_WITHOUT_BODY.has(endpoint.method)) {
      const requestBody = this.buildRequestBody(endpoint);
      if (requestBody) operation.requestBody = requestBody;
    }
    const responses = this.buildResponses(endpoint);
    if (Object.keys(responses).length) operation.responses = responses;
    return operation;
  }

  private buildRequestBody(endpoint: PathFormValue): OpenApiRequestBody | null {
    const entries = (endpoint.requestBody ?? []) as RequestBodyContentFormValue[];
    const filtered = entries.filter(c => c.mimeType && c.schema);
    if (!filtered.length) return null;
    const content: Record<string, { schema: OpenApiSchemaObject }> = {};
    for (const c of filtered) {
      content[c.mimeType] = { schema: { $ref: `#/components/schemas/${c.schema}` } };
    }
    const rb: OpenApiRequestBody = { content };
    if (endpoint.requestBodyRequired) rb.required = true;
    if (endpoint.requestBodyDescription) rb.description = endpoint.requestBodyDescription;
    return rb;
  }

  private buildResponses(endpoint: PathFormValue): Record<string, OpenApiResponse> {
    const responses: Record<string, OpenApiResponse> = {};
    const seen = new Set<string>();
    for (const r of (endpoint.responses ?? []) as ResponseFormValue[]) {
      if (!r.statusCode || seen.has(r.statusCode)) continue;
      seen.add(r.statusCode);
      const response: OpenApiResponse = { description: r.description || '' };
      const contentEntries = (r.contents ?? []).filter(c => c.mimeType && c.schema);
      if (contentEntries.length) {
        response.content = {};
        for (const c of contentEntries) {
          response.content[c.mimeType] = { schema: { $ref: `#/components/schemas/${c.schema}` } };
        }
      }
      responses[r.statusCode] = response;
    }
    return responses;
  }

  // ── Components ────────────────────────────────────────────────────────────

  private buildComponents(): OpenApiComponents {
    const components: OpenApiComponents = {};

    const schemas = this.buildSchemas();
    if (Object.keys(schemas).length) components.schemas = schemas;

    const securitySchemes = this.buildSecuritySchemes();
    if (Object.keys(securitySchemes).length) components.securitySchemes = securitySchemes;

    return components;
  }

  // ── Schemas ───────────────────────────────────────────────────────────────

  private buildSchemas(): Record<string, OpenApiSchemaObject> {
    const schemas: Record<string, OpenApiSchemaObject> = {};
    for (const schema of this.forms.schemasForm.value as SchemaFormValue[]) {
      if (!schema.name) continue;
      schemas[schema.name] = this.buildSchemaObject(schema);
    }
    return schemas;
  }

  private buildSchemaObject(schema: SchemaFormValue): OpenApiSchemaObject {
    switch (schema.kind) {
      case 'object':
        return this.buildObjectSchema(schema);
      case 'primitive':
        return this.buildPrimitiveSchema(schema);
      case 'array':
        return this.buildArraySchema(schema);
      case '$ref':
        return { $ref: `#/components/schemas/${schema.refSchema}` } satisfies OpenApiRefSchema;
      case 'not':
        return {
          not: { $ref: `#/components/schemas/${schema.refSchema}` },
        } satisfies OpenApiNotSchema;
      case 'allOf':
      case 'oneOf':
      case 'anyOf':
        return this.buildComposedSchema(schema);
    }
  }

  private buildObjectSchema(schema: SchemaFormValue): OpenApiObjectSchema {
    const properties: Record<string, OpenApiSchemaObject> = {};
    const required: string[] = [];

    for (const prop of schema.properties ?? []) {
      if (!prop.name) continue;
      properties[prop.name] = this.buildPropertySchema(prop);
      if (prop.required) required.push(prop.name);
    }

    return {
      type: 'object',
      ...(schema.title?.trim() && { title: schema.title }),
      ...(schema.description && { description: schema.description }),
      ...(Object.keys(properties).length && { properties }),
      ...(required.length && { required }),
      ...this.buildAdditionalProperties(schema),
    };
  }

  private buildPrimitiveSchema(schema: SchemaFormValue): OpenApiPrimitiveSchema {
    const type = (schema.type || 'string') as OpenApiPrimitiveSchema['type'];

    const result: OpenApiPrimitiveSchema = {
      type,
      ...(schema.title?.trim() && { title: schema.title }),
      ...(schema.description?.trim() && { description: schema.description }),
      ...(schema.format?.trim() && schema.format !== 'enum' && { format: schema.format }),
      ...(schema.example?.trim() && { example: schema.example }),
    };

    // Only add enum if format === 'enum' and enumValues parsed successfully
    if (schema.format === 'enum' && schema.enumValues?.trim()) {
      const enumArray = this.parseEnumValues(schema.enumValues, type);
      if (enumArray?.length) {
        result.enum = enumArray;
      }
    }

    const parsedDefault = this.parseDefaultValue(schema.default, type);
    if (parsedDefault !== undefined) result.default = parsedDefault;

    return result;
  }

  private buildArraySchema(schema: SchemaFormValue): OpenApiArraySchema {
    const items: OpenApiSchemaObject =
      schema.itemsKind === '$ref'
        ? { $ref: `#/components/schemas/${schema.itemsRef}` }
        : { type: (schema.itemsType || 'string') as OpenApiPrimitiveSchema['type'] };

    return {
      type: 'array',
      ...(schema.title?.trim() && { title: schema.title }),
      items,
      ...(schema.description && { description: schema.description }),
    };
  }

  private buildComposedSchema(schema: SchemaFormValue): OpenApiComposedSchema {
    const refs: OpenApiRefSchema[] = (schema.composedSchemas ?? []).map(n => ({
      $ref: `#/components/schemas/${n}`,
    }));
    return {
      ...(schema.title?.trim() && { title: schema.title }),
      [schema.kind]: refs,
      ...(schema.description && { description: schema.description }),
    };
  }

  private buildPropertySchema(prop: PropertyFormValue): OpenApiSchemaObject {
    const type = prop.type || 'string';

    if (type === '$ref') {
      return { $ref: `#/components/schemas/${prop.refSchema}` } satisfies OpenApiRefSchema;
    }
    if (type === '$ref[]') {
      return {
        type: 'array',
        items: { $ref: `#/components/schemas/${prop.refSchema}` },
      } satisfies OpenApiArraySchema;
    }
    if (type === 'not') {
      return { not: { $ref: `#/components/schemas/${prop.refSchema}` } } satisfies OpenApiNotSchema;
    }
    if (type === 'allOf' || type === 'oneOf' || type === 'anyOf') {
      const refs: OpenApiRefSchema[] = (prop.composedSchemas ?? []).map(n => ({
        $ref: `#/components/schemas/${n}`,
      }));
      return { [type]: refs } satisfies OpenApiComposedSchema;
    }
    if (type.endsWith('[]')) {
      // Array of primitives - enum goes on items
      const baseType = type.slice(0, -2) as OpenApiPrimitiveSchema['type'];

      const items: OpenApiSchemaObject = {
        type: baseType,
        ...(prop.format?.trim() && prop.format !== 'enum' && { format: prop.format }),
      };

      // Only add enum if format === 'enum' and enumValues parsed successfully
      if (prop.format === 'enum' && prop.enumValues?.trim()) {
        const enumArray = this.parseEnumValues(prop.enumValues, baseType);
        if (enumArray?.length) {
          items.enum = enumArray;
        }
      }

      return {
        type: 'array',
        items,
      } satisfies OpenApiArraySchema;
    }

    const primitiveSchema: OpenApiPrimitiveSchema = {
      type: type as OpenApiPrimitiveSchema['type'],
      ...(prop.format?.trim() && prop.format !== 'enum' && { format: prop.format }),
    };

    // Only add enum if format === 'enum' and enumValues parsed successfully
    if (prop.format === 'enum' && prop.enumValues?.trim()) {
      const enumArray = this.parseEnumValues(prop.enumValues, type);
      if (enumArray?.length) {
        primitiveSchema.enum = enumArray;
      }
    }

    const parsedDefault = this.parseDefaultValue(prop.default, type);
    if (parsedDefault !== undefined) primitiveSchema.default = parsedDefault;

    return primitiveSchema;
  }

  // ── Security schemes ──────────────────────────────────────────────────────

  private buildSecuritySchemes(): Record<string, OpenApiSecurityScheme> {
    const schemes: Record<string, OpenApiSecurityScheme> = {};

    for (const s of this.forms.schemesForm.value as SchemeFormValue[]) {
      if (!s.schemeName) continue;

      switch (s.type) {
        case 'apiKey':
          schemes[s.schemeName] = {
            type: 'apiKey',
            name: s.paramName,
            in: s.in,
            ...(s.description && { description: s.description }),
          };
          break;
        case 'http':
          schemes[s.schemeName] = {
            type: 'http',
            scheme: s.scheme,
            ...(s.bearerFormat && { bearerFormat: s.bearerFormat }),
            ...(s.description && { description: s.description }),
          };
          break;
        case 'oauth2': {
          const scopes = Object.fromEntries(
            (s.scopes ?? '').split(/\s+/).filter(Boolean).map(sc => [sc, '']),
          );
          const flow = s.oauthFlow || 'authorizationCode';
          const flows: OpenApiOAuth2Scheme['flows'] = {};
          if (flow === 'implicit') {
            flows.implicit = { authorizationUrl: s.authorizationUrl, scopes };
          } else if (flow === 'password') {
            flows.password = { tokenUrl: s.tokenUrl, scopes };
          } else if (flow === 'clientCredentials') {
            flows.clientCredentials = { tokenUrl: s.tokenUrl, scopes };
          } else {
            flows.authorizationCode = { authorizationUrl: s.authorizationUrl, tokenUrl: s.tokenUrl, scopes };
          }
          schemes[s.schemeName] = {
            type: 'oauth2',
            flows,
            ...(s.description && { description: s.description }),
          };
          break;
        }
        case 'openIdConnect':
          schemes[s.schemeName] = {
            type: 'openIdConnect',
            openIdConnectUrl: s.openIdConnectUrl,
            ...(s.description && { description: s.description }),
          };
          break;
      }
    }

    return schemes;
  }

  // ── Default Value Parser ──────────────────────────────────────────────────

  private parseDefaultValue(
    value: string | undefined,
    type: string,
  ): string | number | boolean | undefined {
    if (!value?.trim()) return undefined;
    const v = value.trim();
    try {
      if (type === 'integer') {
        if (!/^-?\d+$/.test(v)) return undefined;
        return parseInt(v, 10);
      }
      if (type === 'number') {
        const n = parseFloat(v);
        return isNaN(n) ? undefined : n;
      }
      if (type === 'boolean') {
        if (v === 'true' || v === '1') return true;
        if (v === 'false' || v === '0') return false;
        return undefined;
      }
      return v;
    } catch {
      return undefined;
    }
  }

  // ── Enum Values Parser ────────────────────────────────────────────────────
  /**
   * Parse comma-separated enum values with strict type validation.
   * OpenAPI Spec: https://spec.openapis.org/oas/v3.0.3#schema-object
   * Values must match the declared type exactly.
   */
  private parseEnumValues(
    enumString: string,
    type: string
  ): string[] | number[] | boolean[] | undefined {
    if (!enumString?.trim()) return undefined;

    const rawValues = enumString
      .split(',')
      .map((v: string) => v.trim())
      .filter((v: string) => v.length > 0);

    if (rawValues.length === 0) return undefined;

    try {
      if (type === 'integer') {
        // Strictly validate integers - reject decimals and invalid formats
        return rawValues.map((v: string) => {
          if (!/^-?\d+$/.test(v)) {
            throw new Error(`Invalid integer: "${v}"`);
          }
          return parseInt(v, 10);
        });
      }

      if (type === 'number') {
        // Validate numeric format - allow decimals but reject invalid formats
        return rawValues.map((v: string) => {
          const num = parseFloat(v);
          if (isNaN(num)) {
            throw new Error(`Invalid number: "${v}"`);
          }
          return num;
        });
      }

      if (type === 'boolean') {
        // Strict boolean validation - only accept 4 valid values
        return rawValues.map((v: string) => {
          const lower = v.toLowerCase();
          if (!['true', 'false', '1', '0'].includes(lower)) {
            throw new Error(`Invalid boolean: "${v}"`);
          }
          return lower === 'true' || lower === '1';
        });
      }

      // String type - validate safe characters (no control chars, quotes, backslashes)
      rawValues.forEach((v: string) => {
        if (/[\x00-\x1F\\"'`]/.test(v)) {
          throw new Error(`String contains unsafe characters: "${v}"`);
        }
      });

      // Remove duplicates while preserving order
      return Array.from(new Set(rawValues));
    } catch (error) {
      console.warn(
        `Enum parsing error for type "${type}":`,
        error instanceof Error ? error.message : String(error)
      );
      return undefined; // Don't include invalid enums
    }
  }

  // ── Additional Properties ──────────────────────────────────────────────

  private buildAdditionalProperties(
    schema: SchemaFormValue
  ): { additionalProperties: OpenApiAdditionalProperties } | Record<string, never> {
    if (!schema.additionalPropsEnabled) return {};

    // Build as a property-like schema using the same logic as buildPropertySchema
    const type = schema.additionalPropsType || 'string';

    const propertyLike: PropertyFormValue = {
      name: '', // Not used in additionalProperties context
      type,
      format: schema.additionalPropsFormat || '',
      refSchema: schema.additionalPropsRef || '',
      composedSchemas: schema.additionalPropsComposed || [],
      required: false, // Not used in additionalProperties context
      enumValues: schema.additionalPropsEnum || '',
      default: '',
    };

    const builtSchema = this.buildPropertySchema(propertyLike);
    return { additionalProperties: builtSchema };
  }
}
