export type TrustTier = 'low' | 'medium' | 'high'

export type Group = {
  id: string
  name: string
  description?: string
  memberCount: number
  inviteToken: string
  adminAddress: string
  /** @handle of the group admin when known */
  adminHandle?: string
  chainGroupId?: number | null
  createdAt?: string
}

export type Member = {
  address: string
  handle: string
  trustTier: TrustTier
}

export type ExpenseShareStatus = 'pending' | 'paid'

export type ExpenseShare = {
  memberAddress: string
  memberHandle: string
  amountCents: number
  status: ExpenseShareStatus
  /** Payer-only: whether a reminder can be sent now */
  canRemind?: boolean
  /** Payer-only: when another reminder becomes available */
  nextRemindAt?: string
}

export type Expense = {
  id: string
  description: string
  payerAddress: string
  /** Twitter-style handle when known (from group_members). */
  payerHandle?: string
  memberCount: number
  createdAt: string
  /** Present when the viewer is the payer — count of shares still unpaid */
  pendingReceivableCount?: number
  /** Present when the viewer is a participant (not payer) */
  yourShareStatus?: ExpenseShareStatus
  /** Present when the viewer is the payer */
  isYourExpense?: boolean
}

export type ExpenseDetail = {
  id: string
  groupId: string
  description: string
  payerAddress: string
  payerHandle: string
  totalCents: number
  memberCount: number
  createdAt: string
  shares: ExpenseShare[]
  viewerRole: 'payer' | 'participant' | 'observer'
  /** Payer-only: total others owe for this expense */
  receivableCents: number
  /** Payer-only: still outstanding from others */
  pendingReceivableCents: number
  /** Payer-only: participant's own share if they were in the split */
  yourShareCents?: number
  /** Whether the viewer already has an open flag on this expense */
  flaggedByYou?: boolean
}

export type ExpenseActivity = {
  expenseId: string
  groupId: string
  groupName: string
  description: string
  payerHandle: string
  memberCount: number
  createdAt: string
  isYourExpense: boolean
  kind?: 'expense' | 'repayment'
  participantHandle?: string
  isYourRepayment?: boolean
  isYourReceipt?: boolean
}

export type ExpenseCreditSnippet = {
  expenseId: string
  groupId: string
  groupName: string
  description: string
  receivableCents: number
  pendingCents: number
  paidCount: number
  totalCount: number
  createdAt: string
}

export type GroupAction = SettlementAction & {
  groupId: string
  groupName: string
  /** Payee wallet for expense repayments */
  counterpartyAddress?: string
  /** Set when this pay action is an outstanding expense share */
  expenseId?: string
  chainExpenseId?: number | null
  expenseDescription?: string
  createdAt: string
}

export type DashboardSummary = {
  totalYouOweCents: number
  totalOwedToYouCents: number
  netPositionCents: number
  pendingPayCount: number
  pendingReceiveCount: number
  recentActivity: ExpenseActivity[]
  creditsFromExpenses: ExpenseCreditSnippet[]
  payActions: GroupAction[]
  balancesByGroup: {
    groupId: string
    groupName: string
    netCents: number
    createdAt?: string
  }[]
}

export type BalanceEntry = {
  memberAddress: string
  memberHandle: string
  amountCents: number
}

export type SettlementAction = {
  id: string
  counterpartyHandle: string
  amountCents: number
  direction: 'pay' | 'receive'
  status: 'pending' | 'completed'
}

export type Dispute = {
  id: string
  expenseId: string
  status: 'open' | 'dismissed' | 'upheld'
}
