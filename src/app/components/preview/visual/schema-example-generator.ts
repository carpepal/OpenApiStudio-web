import {
  OpenApiSchemaObject,
  OpenApiObjectSchema,
  OpenApiPrimitiveSchema,
  OpenApiArraySchema,
  OpenApiRefSchema,
  OpenApiComposedSchema,
} from '../../../models/open-api.models';

function isRef(s: OpenApiSchemaObject): s is OpenApiRefSchema {
  return '$ref' in s;
}
function isObject(s: OpenApiSchemaObject): s is OpenApiObjectSchema {
  return 'type' in s && (s as any).type === 'object';
}
function isPrimitive(s: OpenApiSchemaObject): s is OpenApiPrimitiveSchema {
  return 'type' in s && ['string', 'integer', 'number', 'boolean'].includes((s as any).type);
}
function isArray(s: OpenApiSchemaObject): s is OpenApiArraySchema {
  return 'type' in s && (s as any).type === 'array';
}
function isComposed(s: OpenApiSchemaObject): s is OpenApiComposedSchema {
  return 'allOf' in s || 'oneOf' in s || 'anyOf' in s;
}

function primitiveDefault(s: OpenApiPrimitiveSchema): unknown {
  if (s.example !== undefined) return s.example;
  if (s.enum && s.enum.length > 0) return s.enum[0];
  if (s.default !== undefined) return s.default;
  switch (s.type) {
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return true;
    case 'string':
      if (s.format === 'date') return '2024-01-15';
      if (s.format === 'date-time') return '2024-01-15T00:00:00Z';
      if (s.format === 'email') return 'user@example.com';
      if (s.format === 'uri' || s.format === 'url') return 'https://example.com';
      if (s.format === 'uuid') return '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      return 'string';
    default:
      return 'string';
  }
}

export function generateExample(
  schema: OpenApiSchemaObject,
  schemas: Record<string, OpenApiSchemaObject> = {},
  depth = 0
): unknown {
  if (depth > 4) return {};

  if (isRef(schema)) {
    const refName = schema.$ref.split('/').pop() ?? '';
    const resolved = schemas[refName];
    if (!resolved) return {};
    return generateExample(resolved, schemas, depth + 1);
  }

  if (isObject(schema)) {
    if (!schema.properties) return {};
    const result: Record<string, unknown> = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      result[key] = generateExample(propSchema, schemas, depth + 1);
    }
    return result;
  }

  if (isPrimitive(schema)) {
    return primitiveDefault(schema);
  }

  if (isArray(schema)) {
    return [generateExample(schema.items, schemas, depth + 1)];
  }

  if (isComposed(schema)) {
    if (schema.allOf && schema.allOf.length > 0) {
      const merged: Record<string, unknown> = {};
      for (const sub of schema.allOf) {
        const ex = generateExample(sub, schemas, depth + 1);
        if (typeof ex === 'object' && ex !== null && !Array.isArray(ex)) {
          Object.assign(merged, ex);
        }
      }
      return merged;
    }
    const first = schema.oneOf?.[0] ?? schema.anyOf?.[0];
    if (first) return generateExample(first, schemas, depth + 1);
    return {};
  }

  // not schema
  return {};
}
