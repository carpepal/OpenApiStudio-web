// ── OpenAPI 3.0 output models ─────────────────────────────────────────────

export interface OpenApiSpec {
  openapi: string;
  info: OpenApiInfo;
  servers?: OpenApiServer[];
  tags?: OpenApiTag[];
  paths?: Record<string, OpenApiPathItem>;
  components?: OpenApiComponents;
}

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
  contact?: { email: string };
  license?: { name: string };
}

export interface OpenApiServer {
  url: string;
  description?: string;
}

export interface OpenApiTag {
  name: string;
  description?: string;
  externalDocs?: { url: string };
}

export type OpenApiPathItem = Record<string, OpenApiOperation>;

export interface OpenApiResponse {
  description: string;
  content?: Record<string, { schema: OpenApiSchemaObject }>;
}

export interface OpenApiOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  security?: Record<string, string[]>[];
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses?: Record<string, OpenApiResponse>;
}

export interface OpenApiParameter {
  in: 'path' | 'query' | 'header' | 'cookie';
  name: string;
  required: boolean;
  schema: OpenApiPrimitiveSchema;
  description?: string;
}

export interface OpenApiRequestBody {
  required?: boolean;
  content: Record<string, { schema: OpenApiSchemaObject }>;
}

export interface OpenApiComponents {
  schemas?: Record<string, OpenApiSchemaObject>;
  securitySchemes?: Record<string, OpenApiSecurityScheme>;
}

// ── Schema types ──────────────────────────────────────────────────────────

export type OpenApiSchemaObject =
  | OpenApiObjectSchema
  | OpenApiPrimitiveSchema
  | OpenApiArraySchema
  | OpenApiRefSchema
  | OpenApiComposedSchema
  | OpenApiNotSchema;

export interface OpenApiObjectSchema {
  type: 'object';
  description?: string;
  properties?: Record<string, OpenApiSchemaObject>;
  required?: string[];
}

export interface OpenApiPrimitiveSchema {
  type: 'string' | 'integer' | 'number' | 'boolean';
  description?: string;
  format?: string;
  example?: string;
}

export interface OpenApiArraySchema {
  type: 'array';
  items: OpenApiSchemaObject;
  description?: string;
}

export interface OpenApiRefSchema {
  $ref: string;
}

export interface OpenApiComposedSchema {
  allOf?: OpenApiSchemaObject[];
  oneOf?: OpenApiSchemaObject[];
  anyOf?: OpenApiSchemaObject[];
  description?: string;
}

export interface OpenApiNotSchema {
  not: OpenApiSchemaObject;
}

// ── Security scheme types ─────────────────────────────────────────────────

export type OpenApiSecurityScheme =
  | OpenApiApiKeyScheme
  | OpenApiHttpScheme
  | OpenApiOAuth2Scheme
  | OpenApiOpenIdConnectScheme;

export interface OpenApiApiKeyScheme {
  type: 'apiKey';
  name: string;
  in: 'header' | 'query' | 'cookie';
  description?: string;
}

export interface OpenApiHttpScheme {
  type: 'http';
  scheme: string;
  bearerFormat?: string;
  description?: string;
}

export interface OpenApiOAuth2Scheme {
  type: 'oauth2';
  flows: {
    authorizationCode: {
      authorizationUrl: string;
      tokenUrl: string;
      scopes: Record<string, string>;
    };
  };
  description?: string;
}

export interface OpenApiOpenIdConnectScheme {
  type: 'openIdConnect';
  openIdConnectUrl: string;
  description?: string;
}
