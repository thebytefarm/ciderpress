/**
 * Pluralize `singular` based on `n`. Appends `s` by default; pass an
 * explicit `many` form for irregular words (`person`/`people`).
 * @param n - the count
 * @param singular - the singular form
 * @param many - the plural form (defaults to `${singular}s`)
 * @returns the appropriate form
 */
export function plural(n: number, singular: string, many = `${singular}s`): string {
  if (n === 1) {
    return singular
  }
  return many
}
