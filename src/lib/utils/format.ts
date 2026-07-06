export function formatAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function truncateAddress(address: string): string {
  if (address.length < 10) return address
  return `${address.slice(0, 5)}...${address.slice(-4)}`
}

export function formatHandle(handle: string): string {
  if (handle === 'you') return 'You'
  if (handle.startsWith('0x')) return truncateAddress(handle)
  return handle.startsWith('@') ? handle : `@${handle}`
}

export function isExpenseYours(
  expense: { isYourExpense?: boolean; payerAddress: string },
  viewerAddress?: string,
): boolean {
  if (expense.isYourExpense) return true
  if (!viewerAddress) return false
  return expense.payerAddress.toLowerCase() === viewerAddress.toLowerCase()
}

/** Display name for expense payer — "You" when the viewer paid. */
export function payerDisplayName(
  expense: {
    isYourExpense?: boolean
    payerHandle?: string
    payerAddress: string
  },
  viewerAddress?: string,
): string {
  if (isExpenseYours(expense, viewerAddress)) return 'You'
  return formatHandle(expense.payerHandle ?? expense.payerAddress)
}

/** Admin label for group list items — "You" when the viewer is admin. */
export function groupAdminLabel(
  group: { adminAddress: string; adminHandle?: string },
  viewerAddress?: string,
): string {
  if (
    viewerAddress &&
    group.adminAddress.toLowerCase() === viewerAddress.toLowerCase()
  ) {
    return 'You'
  }
  return formatHandle(group.adminHandle ?? group.adminAddress)
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
