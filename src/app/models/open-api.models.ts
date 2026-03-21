// ── OpenAPI 3.0 output models ─────────────────────────────────────────────

export interface OpenApiSpec {
  openapi: string;
  info: OpenApiInfo;
  servers?: OpenApiServer[];
  tags?: OpenApiTag[];
  paths?: Record<string, OpenApiPathItem>;
  components?: OpenApiComponents;
  externalDocs?: { description?: string; url: string };
}

export interface OpenApiInfo {
  title: string;
  version: string;
  description?: string;
  contact?: { name?: string; url?: string; email?: string };
  license?: { name: string; url?: string };
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
  style?: string;
  explode?: boolean;
  allowEmptyValue?: boolean;
}

export interface OpenApiRequestBody {
  required?: boolean;
  description?: string;
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

export type OpenApiAdditionalProperties = false | OpenApiSchemaObject;

export interface OpenApiObjectSchema {
  type: 'object';
  title?: string;
  description?: string;
  properties?: Record<string, OpenApiSchemaObject>;
  required?: string[];
  additionalProperties?: OpenApiAdditionalProperties;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
}

export interface OpenApiPrimitiveSchema {
  type: 'string' | 'integer' | 'number' | 'boolean';
  title?: string;
  description?: string;
  format?: string;
  example?: string;
  enum?: string[] | number[] | boolean[];
  default?: string | number | boolean;
  // Numeric constraints
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
  multipleOf?: number;
  // String constraints
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  // Flags
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
}

export interface OpenApiArraySchema {
  type: 'array';
  title?: string;
  items: OpenApiSchemaObject;
  description?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
}

export interface OpenApiRefSchema {
  $ref: string;
}

export interface OpenApiComposedSchema {
  title?: string;
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
    implicit?: { authorizationUrl: string; scopes: Record<string, string> };
    password?: { tokenUrl: string; scopes: Record<string, string> };
    clientCredentials?: { tokenUrl: string; scopes: Record<string, string> };
    authorizationCode?: { authorizationUrl: string; tokenUrl: string; scopes: Record<string, string> };
  };
  description?: string;
}

export interface OpenApiOpenIdConnectScheme {
  type: 'openIdConnect';
  openIdConnectUrl: string;
  description?: string;
}
