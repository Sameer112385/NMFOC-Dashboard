const DEFAULT_PAGE_SIZE = 1000;

export async function fetchAllSupabaseRows<T>(
  createQuery: () => any,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const to = from + pageSize - 1;
    const { data, error } = await createQuery().range(from, to);
    if (error) throw error;

    const page = (data ?? []) as T[];
    rows.push(...page);

    if (page.length < pageSize) break;
  }

  return rows;
}
