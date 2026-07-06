import { and, desc, eq, gt } from 'drizzle-orm'
import { db, schema } from '../db/client.ts'
import { normalizeAddress } from './normalize.ts'

export const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000

export function nextRemindAt(lastSentAt: Date): string {
  return new Date(lastSentAt.getTime() + REMINDER_COOLDOWN_MS).toISOString()
}

/** Latest reminder per recipient within the 24h cooldown window. */
export async function recentRemindersByRecipient(
  expenseId: string,
  recipientAddresses: string[],
): Promise<Map<string, Date>> {
  if (recipientAddresses.length === 0) return new Map()

  const since = new Date(Date.now() - REMINDER_COOLDOWN_MS)
  const rows = await db
    .select({
      recipientAddress: schema.expenseReminders.recipientAddress,
      sentAt: schema.expenseReminders.sentAt,
    })
    .from(schema.expenseReminders)
    .where(
      and(
        eq(schema.expenseReminders.expenseId, expenseId),
        gt(schema.expenseReminders.sentAt, since),
      ),
    )
    .orderBy(desc(schema.expenseReminders.sentAt))

  const byRecipient = new Map<string, Date>()
  const wanted = new Set(recipientAddresses.map(normalizeAddress))

  for (const row of rows) {
    const wallet = normalizeAddress(row.recipientAddress)
    if (!wanted.has(wallet) || byRecipient.has(wallet)) continue
    byRecipient.set(wallet, row.sentAt)
  }

  return byRecipient
}

export function canSendReminder(lastSentAt: Date | undefined): boolean {
  if (!lastSentAt) return true
  return Date.now() - lastSentAt.getTime() >= REMINDER_COOLDOWN_MS
}
