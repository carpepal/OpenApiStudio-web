import {
  OpenApiSchemaObject,
  OpenApiRefSchema,
  OpenApiNotSchema,
  OpenApiComposedSchema,
  OpenApiObjectSchema,
  OpenApiArraySchema,
  OpenApiPrimitiveSchema,
} from '../../../models/open-api.models';

export function isRefSchema(schema: OpenApiSchemaObject): schema is OpenApiRefSchema {
  return '$ref' in schema;
}

export function isNotSchema(schema: OpenApiSchemaObject): schema is OpenApiNotSchema {
  return 'not' in schema;
}

export function isComposedSchema(schema: OpenApiSchemaObject): schema is OpenApiComposedSchema {
  return !isRefSchema(schema) && !isNotSchema(schema) &&
    ('allOf' in schema || 'oneOf' in schema || 'anyOf' in schema);
}

export function isObjectSchema(schema: OpenApiSchemaObject): schema is OpenApiObjectSchema {
  return !isRefSchema(schema) && 'type' in schema && (schema as OpenApiObjectSchema).type === 'object';
}

export function isArraySchema(schema: OpenApiSchemaObject): schema is OpenApiArraySchema {
  return !isRefSchema(schema) && 'type' in schema && (schema as OpenApiArraySchema).type === 'array';
}

export function isPrimitiveSchema(schema: OpenApiSchemaObject): schema is OpenApiPrimitiveSchema {
  if (isRefSchema(schema)) return false;
  const type = (schema as OpenApiPrimitiveSchema).type;
  return type === 'string' || type === 'integer' || type === 'number' || type === 'boolean';
}
