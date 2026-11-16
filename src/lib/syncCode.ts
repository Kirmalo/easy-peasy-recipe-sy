/** Normalises user-typed sync codes ("abcd efgh jkmn") to "ABCD-EFGH-JKMN", or null if malformed. */
export function normalizeSyncCode(input: string): string | null {
  const chars = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{12}$/.test(chars)) return null;
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}
