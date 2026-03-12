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
    if (v.contactEmail) info.contact = { email: v.contactEmail };
    if (v.license) info.license = { name: v.license };
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
      .map((p: QueryParamFormValue) => ({
        in: 'query' as const,
        name: p.name,
        required: !!p.required,
        schema: { type: (p.type || 'string') as OpenApiPrimitiveSchema['type'] },
        ...(p.description && { description: p.description }),
      }));

    return [...pathParams, ...queryParams];
  }

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
    const requestBody = this.buildRequestBody(endpoint);
    if (requestBody) operation.requestBody = requestBody;
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
    return { content };
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
      ...(schema.description && { description: schema.description }),
      ...(Object.keys(properties).length && { properties }),
      ...(required.length && { required }),
    };
  }

  private buildPrimitiveSchema(schema: SchemaFormValue): OpenApiPrimitiveSchema {
    return {
      type: (schema.type || 'string') as OpenApiPrimitiveSchema['type'],
      ...(schema.description && { description: schema.description }),
      ...(schema.format && { format: schema.format }),
      ...(schema.example && { example: schema.example }),
    };
  }

  private buildArraySchema(schema: SchemaFormValue): OpenApiArraySchema {
    const items: OpenApiSchemaObject =
      schema.itemsKind === '$ref'
        ? { $ref: `#/components/schemas/${schema.itemsRef}` }
        : { type: (schema.itemsType || 'string') as OpenApiPrimitiveSchema['type'] };

    return {
      type: 'array',
      items,
      ...(schema.description && { description: schema.description }),
    };
  }

  private buildComposedSchema(schema: SchemaFormValue): OpenApiComposedSchema {
    const refs: OpenApiRefSchema[] = (schema.composedSchemas ?? []).map(n => ({
      $ref: `#/components/schemas/${n}`,
    }));
    return {
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
      return {
        type: 'array',
        items: { type: type.slice(0, -2) as OpenApiPrimitiveSchema['type'] },
      } satisfies OpenApiArraySchema;
    }

    const primitiveSchema: OpenApiPrimitiveSchema = {
      type: type as OpenApiPrimitiveSchema['type'],
    };
    if (prop.format) primitiveSchema.format = prop.format;
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
          schemes[s.schemeName] = {
            type: 'oauth2',
            flows: {
              authorizationCode: {
                authorizationUrl: s.authorizationUrl,
                tokenUrl: s.tokenUrl,
                scopes,
              },
            },
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
}
