export function parsePageParam(pageParam: string | string[] | undefined) {
  const rawPage = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const page = Number.parseInt(rawPage ?? "1", 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function paginatedCanonicalPath(path: string, page: number) {
  return page > 1 ? `${path}?page=${page}` : path;
}
