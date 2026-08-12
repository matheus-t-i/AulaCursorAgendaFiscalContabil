/**
 * Formats a DATE / UTC-midnight ISO string as YYYY-MM-DD
 * using UTC calendar parts so the key never shifts a day in
 * America/Sao_Paulo (or any negative-offset timezone).
 * Must match AulaBSSP-api/src/lib/dateOnly.ts.
 */
export function toDateOnlyKey(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local calendar date as YYYY-MM-DD (for month grid cells). */
export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
