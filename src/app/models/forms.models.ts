// ── Form value models (reflect the shape of each FormGroup.value) ──────────

export interface ApiInfoFormValue {
  title: string;
  version: string;
  description: string;
  contactEmail: string;
  contactName: string;
  contactUrl: string;
  license: string;
  licenseUrl: string;
  externalDocsUrl: string;
  externalDocsDescription: string;
}

export interface ServerFormValue {
  url: string;
  entorno: string;
  descripcion: string;
}

export interface TagFormValue {
  name: string;
  externalDocsUrl: string;
  description: string;
}

export interface SchemeFormValue {
  schemeName: string;
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description: string;
  // apiKey
  paramName: string;
  in: 'header' | 'query' | 'cookie';
  // http
  scheme: string;
  bearerFormat: string;
  // oauth2
  oauthFlow: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string;
  // openIdConnect
  openIdConnectUrl: string;
}

export interface PropertyFormValue {
  name: string;
  type: string;
  format: string;
  refSchema: string;
  composedSchemas: string[];
  required: boolean;
  enumValues: string;
  default: string;
}


export interface SchemaFormValue {
  name: string;
  kind: 'object' | 'primitive' | 'array' | '$ref' | 'allOf' | 'oneOf' | 'anyOf' | 'not';
  title: string;
  description: string;
  // primitive
  type: string;
  format: string;
  example: string;
  enumValues: string;
  default: string;
  // object
  properties: PropertyFormValue[];
  additionalPropsEnabled: boolean;
  additionalPropsType: string;
  additionalPropsFormat: string;
  additionalPropsRef: string;
  additionalPropsComposed: string[];
  additionalPropsEnum: string;
  // array
  itemsKind: 'primitive' | '$ref';
  itemsType: string;
  itemsRef: string;
  // $ref / not / allOf / oneOf / anyOf
  refSchema: string;
  composedSchemas: string[];
}

export interface PathParamFormValue {
  name: string;
  type: string;
  description: string;
}

export interface QueryParamFormValue {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default: string;
}

export interface RequestBodyContentFormValue {
  mimeType: string;
  schema: string;
}

export interface ResponseContentFormValue {
  mimeType: string;
  schema: string;
}

export interface ResponseFormValue {
  statusCode: string;
  description: string;
  contents: ResponseContentFormValue[];
}

export interface PathFormValue {
  path: string;
  method: string;
  operationId: string;
  summary: string;
  tags: string[];
  security: string[];
  requestBody: RequestBodyContentFormValue[];
  requestBodyRequired: boolean;
  requestBodyDescription: string;
  description: string;
  pathParams: PathParamFormValue[];
  queryParams: QueryParamFormValue[];
  responses: ResponseFormValue[];
}
