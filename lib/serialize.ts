/**
 * Converts snake_case keys to camelCase for API responses.
 */
export function toCamelCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null ? toCamelCase(item as Record<string, unknown>) : item
    ) as unknown as Record<string, unknown>;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[camelKey] = toCamelCase(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[camelKey] = value.map((item) =>
        typeof item === 'object' && item !== null ? toCamelCase(item as Record<string, unknown>) : item
      );
    } else {
      result[camelKey] = value;
    }
  }
  return result;
}

/**
 * Converts camelCase keys to snake_case for database inserts/updates.
 */
export function toSnakeCase<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}

export function serialize<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (Array.isArray(data)) {
    return data.map((item) =>
      typeof item === 'object' && item !== null ? (toCamelCase(item as Record<string, unknown>) as T) : item
    ) as T;
  }
  if (typeof data === 'object') {
    return toCamelCase(data as Record<string, unknown>) as T;
  }
  return data;
}
