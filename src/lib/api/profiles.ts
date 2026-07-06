import type { Member } from '../../types/contracts.ts'
import { apiFetch } from './client.ts'

export async function searchProfiles(query: string): Promise<Member[]> {
  const rows = await apiFetch<{ address: string; handle: string; trustTier: Member['trustTier'] }[]>(
    `/profiles?q=${encodeURIComponent(query)}`,
  )
  return rows.map((row) => ({
    address: row.address,
    handle: row.handle,
    trustTier: row.trustTier,
  }))
}
