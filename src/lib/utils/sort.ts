/** Newest first (ISO `createdAt` strings). */
export function sortByLatest<T extends { createdAt: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Newest first when `createdAt` may be missing (falls back to end). */
export function sortByLatestOptional<T extends { createdAt?: string }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
}
