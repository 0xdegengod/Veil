import { randomBytes } from 'node:crypto'
import { and, eq, gt } from 'drizzle-orm'
import { db, schema } from '../db/client.ts'
import { normalizeAddress } from './normalize.ts'

const NONCE_TTL_MS = 5 * 60 * 1000

export async function issueNonce(walletAddress: string): Promise<string> {
  const address = normalizeAddress(walletAddress)
  const nonce = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + NONCE_TTL_MS)

  await db
    .insert(schema.authNonces)
    .values({ walletAddress: address, nonce, expiresAt })
    .onConflictDoUpdate({
      target: schema.authNonces.walletAddress,
      set: { nonce, expiresAt },
    })

  return nonce
}

export async function consumeNonce(walletAddress: string, nonce: string): Promise<boolean> {
  const address = normalizeAddress(walletAddress)
  const now = new Date()

  const [row] = await db
    .select()
    .from(schema.authNonces)
    .where(
      and(
        eq(schema.authNonces.walletAddress, address),
        eq(schema.authNonces.nonce, nonce),
        gt(schema.authNonces.expiresAt, now),
      ),
    )
    .limit(1)

  if (!row) return false

  await db.delete(schema.authNonces).where(eq(schema.authNonces.walletAddress, address))
  return true
}
