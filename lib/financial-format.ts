export function truncateToTwoDecimals(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(value * 100) / 100;
}

export function truncateFinancialOutput<T extends Record<string, any>>(row: T): T {
  const output: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'number') {
      output[key] = truncateToTwoDecimals(value);
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value) && isPlainNumericMap(value)) {
      output[key] = Object.fromEntries(
        Object.entries(value).map(([mapKey, mapValue]) => [
          mapKey,
          typeof mapValue === 'number' ? truncateToTwoDecimals(mapValue) : mapValue,
        ]),
      );
      continue;
    }

    output[key] = value;
  }

  return output as T;
}

function isPlainNumericMap(value: object) {
  return Object.values(value).every((item) => typeof item === 'number' || item === null || item === undefined);
}
