// A source older than 48 hours is useful context, but remains visible with its real timestamp.
export const staleAfterMs = 48 * 60 * 60 * 1000;

export function staleWarning(updatedAt: string | null, now = Date.now()): string | null {
  if (updatedAt === null) return null;
  const age = now - Date.parse(updatedAt);
  return Number.isFinite(age) && age > staleAfterMs
    ? "Source data is more than 48 hours old; confirm its current state before relying on it."
    : null;
}
