import slugifyPkg from "slugify";

type SlugifyFn = (
  value: string,
  options?: { lower?: boolean; strict?: boolean; replacement?: string } | string,
) => string;

// `slugify` ships loose ambient types; narrow to a callable once here.
const slugifyFn = slugifyPkg as unknown as SlugifyFn;

/** Lowercase kebab-case slug, generated locally (no network). */
export function toSlug(value: string): string {
  return slugifyFn(value, { lower: true, strict: true });
}

/** Machine key: lowercase, `_` separators. */
export function toOptionKey(value: string): string {
  return slugifyFn(value, { lower: true, replacement: "_" });
}
