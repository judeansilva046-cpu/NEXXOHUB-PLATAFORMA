export type SupabaseRelation<T> = T | T[] | null;

export function firstRelation<T>(relation: SupabaseRelation<T> | undefined) {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] || null : relation;
}
