import { and, eq } from 'drizzle-orm'
import { db, schema } from '../db/client.ts'
import { recentRemindersByRecipient } from './reminders.ts'

/** Reminder + flag metadata for expense detail — skips if tables are not migrated yet. */
export async function loadExpenseMeta(
  expenseId: string,
  groupId: string,
  wallet: string,
  role: 'payer' | 'participant' | 'observer',
  pendingRecipientAddresses: string[],
): Promise<{
  recentReminders: Map<string, Date>
  flaggedByYou: boolean
}> {
  let recentReminders = new Map<string, Date>()
  let flaggedByYou = false

  if (role === 'payer' && pendingRecipientAddresses.length > 0) {
    try {
      recentReminders = await recentRemindersByRecipient(
        expenseId,
        pendingRecipientAddresses,
      )
    } catch (err) {
      console.error('[expense_meta] expense_reminders unavailable:', err)
    }
  }

  try {
    const [existingFlag] = await db
      .select({ id: schema.expenseDisputes.id })
      .from(schema.expenseDisputes)
      .where(
        and(
          eq(schema.expenseDisputes.expenseId, expenseId),
          eq(schema.expenseDisputes.flaggerAddress, wallet),
          eq(schema.expenseDisputes.status, 'open'),
        ),
      )
      .limit(1)
    flaggedByYou = Boolean(existingFlag)
  } catch (err) {
    console.error('[expense_meta] expense_disputes unavailable:', err)
  }

  void groupId
  return { recentReminders, flaggedByYou }
}
