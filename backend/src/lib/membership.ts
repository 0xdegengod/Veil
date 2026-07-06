import { and, eq } from 'drizzle-orm'
import { db, schema } from '../db/client.ts'
import { normalizeAddress } from './normalize.ts'

export async function isGroupMember(groupId: string, wallet: string): Promise<boolean> {
  const [row] = await db
    .select({ walletAddress: schema.groupMembers.walletAddress })
    .from(schema.groupMembers)
    .where(
      and(
        eq(schema.groupMembers.groupId, groupId),
        eq(schema.groupMembers.walletAddress, normalizeAddress(wallet)),
      ),
    )
    .limit(1)

  return Boolean(row)
}

export async function assertGroupMember(groupId: string, wallet: string): Promise<void> {
  if (!(await isGroupMember(groupId, wallet))) {
    throw new Error('forbidden')
  }
}

export async function getGroupOrThrow(groupId: string) {
  const [group] = await db.select().from(schema.groups).where(eq(schema.groups.id, groupId)).limit(1)
  if (!group) throw new Error('not_found')
  return group
}
