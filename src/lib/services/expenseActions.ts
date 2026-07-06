import { flagExpense, remindExpenseShare } from '../api/expenses.ts'
import { ApiError } from '../api/client.ts'

export async function sendExpenseReminder(
  groupId: string,
  expenseId: string,
  memberAddress: string,
): Promise<void> {
  await remindExpenseShare(groupId, expenseId, memberAddress)
}

export async function submitExpenseFlag(
  groupId: string,
  expenseId: string,
  reason: string,
): Promise<{ id: string; expenseId: string; status: string }> {
  return flagExpense(groupId, expenseId, reason)
}

export function reminderErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const details = err.details as { reason?: string } | undefined
    if (details?.reason === 'reminder_cooldown') {
      return 'Reminder already sent today. Try again tomorrow.'
    }
  }
  if (err instanceof Error && err.message === 'reminder_cooldown') {
    return 'Reminder already sent today. Try again tomorrow.'
  }
  return 'Could not send reminder'
}

export function flagErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const details = err.details as { reason?: string } | undefined
    if (details?.reason === 'already_flagged') {
      return 'You already flagged this expense'
    }
  }
  if (err instanceof Error && err.message === 'already_flagged') {
    return 'You already flagged this expense'
  }
  return 'Could not submit flag'
}
