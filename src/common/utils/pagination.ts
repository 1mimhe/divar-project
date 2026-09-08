/** Paginated envelope returned by list endpoints. */
export interface Page<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/** Wraps query results with page math. */
export function toPage<T>(data: T[], total: number, page: number, limit: number): Page<T> {
  return { data, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) };
}
