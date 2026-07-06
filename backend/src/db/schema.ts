import {
  bigint,
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

/**
 * PRIVACY INVARIANT: this database stores NO plaintext amounts. Encrypted balances
 * and settlement amounts live on-chain as ciphertext handles. Here we keep only
 * non-sensitive metadata: identities, group names/descriptions, invites, and
 * action-only notifications. Expense share settlement status (paid/pending) is
 * plaintext per ConfidentialLedger — dollar amounts are decrypted client-side.
 */

export const profiles = pgTable('profiles', {
  walletAddress: text('wallet_address').primaryKey(),
  /** User-chosen @handle, assigned during onboarding. */
  handle: text('handle').notNull().unique(),
  displayName: text('display_name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const authNonces = pgTable('auth_nonces', {
  walletAddress: text('wallet_address').primaryKey(),
  nonce: text('nonce').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Corresponding on-chain GroupRegistry id (null until the tx is mined). */
  chainGroupId: bigint('chain_group_id', { mode: 'number' }),
  name: text('name').notNull(),
  description: text('description'),
  inviteToken: text('invite_token').notNull().unique(),
  /** Settlement preferences (UI/off-chain only). */
  settlementToken: text('settlement_token').notNull().default('USDC'),
  cadence: text('cadence').notNull().default('manual'),
  adminAddress: text('admin_address').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const groupMembers = pgTable(
  'group_members',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    walletAddress: text('wallet_address').notNull(),
    handle: text('handle').notNull(),
    trustTier: text('trust_tier').notNull().default('medium'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.groupId, t.walletAddress] }),
    byWallet: index('group_members_wallet_idx').on(t.walletAddress),
  }),
)

export const invites = pgTable('invites', {
  token: text('token').primaryKey(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => groups.id, { onDelete: 'cascade' }),
  inviterAddress: text('inviter_address').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recipientAddress: text('recipient_address').notNull(),
    type: text('type').notNull(), // 'expense' | 'settlement' | 'invite' | 'dispute'
    message: text('message').notNull(), // action-only, never contains amounts
    link: text('link'),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byRecipient: index('notifications_recipient_idx').on(t.recipientAddress),
  }),
)

/** Expense feed metadata. Amounts live on-chain (ConfidentialLedger). */
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    /** ConfidentialLedger expense id (null until the tx is mined). */
    chainExpenseId: bigint('chain_expense_id', { mode: 'number' }),
    payerAddress: text('payer_address').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byGroup: index('expenses_group_idx').on(t.groupId),
    byGroupCreated: index('expenses_group_created_idx').on(t.groupId, t.createdAt),
  }),
)

/** Who was in the split — ACL hints + plaintext settlement status (no amounts). */
export const expenseParticipants = pgTable(
  'expense_participants',
  {
    expenseId: uuid('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    walletAddress: text('wallet_address').notNull(),
    status: text('status').notNull().default('pending'),
    /** Set when a participant repays via verified on-chain ETH transfer. */
    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.expenseId, t.walletAddress] }),
    byWallet: index('expense_participants_wallet_idx').on(t.walletAddress),
  }),
)

/** Payer-initiated repayment nudges — one per recipient per expense per 24h. */
export const expenseReminders = pgTable(
  'expense_reminders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseId: uuid('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    recipientAddress: text('recipient_address').notNull(),
    sentByAddress: text('sent_by_address').notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byExpenseRecipient: index('expense_reminders_expense_recipient_idx').on(
      t.expenseId,
      t.recipientAddress,
      t.sentAt,
    ),
  }),
)

/**
 * Anonymous expense flags (disputes). Flagger identity is stored for abuse prevention
 * but is not exposed to other group members — only admins see dispute metadata.
 */
export const expenseDisputes = pgTable(
  'expense_disputes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    expenseId: uuid('expense_id')
      .notNull()
      .references(() => expenses.id, { onDelete: 'cascade' }),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    flaggerAddress: text('flagger_address').notNull(),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('open'), // open | dismissed | upheld
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (t) => ({
    byExpense: index('expense_disputes_expense_idx').on(t.expenseId),
    byGroup: index('expense_disputes_group_idx').on(t.groupId),
  }),
)

/** Settlement metadata. Encrypted amounts live on-chain (Settlements). */
export const settlements = pgTable(
  'settlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id, { onDelete: 'cascade' }),
    chainSettlementId: bigint('chain_settlement_id', { mode: 'number' }),
    payerAddress: text('payer_address').notNull(),
    payeeAddress: text('payee_address').notNull(),
    /** UI-only scheduling hint — not enforced on-chain. */
    cutoffDate: text('cutoff_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byGroup: index('settlements_group_idx').on(t.groupId),
    byWallet: index('settlements_payer_idx').on(t.payerAddress),
    byPayee: index('settlements_payee_idx').on(t.payeeAddress),
  }),
)
