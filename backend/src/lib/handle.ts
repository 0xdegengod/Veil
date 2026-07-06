/** Normalize and validate a user-chosen @handle. */
export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^@/, '').toLowerCase()
}

export function isValidHandle(handle: string): boolean {
  return /^[a-z0-9_]{3,32}$/.test(handle)
}
