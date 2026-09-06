/** Escapes user input for safe `RegExp` construction (blocks ReDoS patterns). */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
