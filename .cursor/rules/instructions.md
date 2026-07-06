# Veil Frontend — Cursor Instructions

## Project
On-chain confidential group expense splitting built on Zama FHEVM.
Users decrypt only their own authorized ciphertexts; settlements are private.
Adversary model: **everyone** (group members, platform operators, chain observers).

## Stack
- Vite + React + TypeScript
- Tailwind CSS (light/dark via class toggle)
- wagmi v2 + viem + RainbowKit (wallet)
- @fhevm/sdk (FHE encryption/decryption)
- @tanstack/react-query (server state)
- Zustand (client state)
- React Router v6 (routing)
- Supabase (auth + DB metadata only — no plaintext amounts)
- NextAuth Twitter OAuth

---

## Zama Protocol (privacy layer)

Reference: https://docs.zama.org/protocol/protocol/overview

- **FHEVM Solidity library** — encrypted data types and homomorphic ops in contracts
- **Host contracts** — on-chain ACL and encrypted computation triggers
- **Gateway** — validates inputs, manages ACLs, orchestrates coprocessors
- **Coprocessors** — run FHE computations off-chain, commit results
- **KMS** — threshold decryption via MPC
- **Relayer** — client path for encrypt/decrypt requests

All FHE client calls go through `lib/fhe/` — never inline `@fhevm/sdk` in components.

---

## Threat Model & Privacy Invariants

| Invariant | Rule |
|-----------|------|
| Decryption | Member A cannot decrypt Member B's balance or settlement amount |
| UI scope | Never fetch/decrypt foreign balances |
| Settlement | Only payer + payee see settlement amount; no group-wide debt board |
| Notifications | Action-only, role-scoped ("You have a settlement action") — no amounts for non-parties |
| Backend | Supabase stores no plaintext amounts (ciphertext handles/IDs only) |
| Explorers | No public explorer links for private settlement or expense txs |

---

## Disclosure Matrix

| Data | Who can see plaintext | Storage |
|------|----------------------|---------|
| Expense amount | ACL-authorized roles only (payer + split participants) | Ciphertext on-chain |
| Expense description | Group members (treat as sensitive; prefer category labels) | Plaintext metadata |
| My net balance | Me only (reveal + 5-min auto-lock) | Ciphertext on-chain |
| Others' balances | Never | — |
| Settlement instruction | Payer + payee only | Ciphertext on-chain |
| Settlement confirmation | Participant-scoped (payer sees pay confirmation) | Ephemeral UI |
| Trust score | Self only | Encrypted or self-scoped |
| Dispute vote | Encrypted aggregate only; no per-voter leakage | Ciphertext |

---

## Folder Structure
```
src/
├── components/
│   ├── balance/
│   │   ├── BalanceCard.tsx        # my balance only: locked/revealed + countdown
│   │   ├── RevealButton.tsx       # EIP-712 trigger + loading states
│   │   └── MyActions.tsx          # my pending settlement actions only
│   ├── expenses/
│   │   ├── ExpenseForm.tsx        # bottom sheet, amount input, split toggle
│   │   ├── ExpenseFeed.tsx        # list with skeleton loader
│   │   └── ExpenseCard.tsx        # single expense + flag button
│   ├── settlement/
│   │   ├── CreateSettlement.tsx   # mode picker + cutoff date
│   │   ├── SettlementCard.tsx     # participant-scoped: payer/payee only
│   │   └── PayButton.tsx          # approve + transfer flow
│   ├── group/
│   │   ├── GroupCard.tsx          # group summary tile
│   │   ├── MemberSearch.tsx       # @handle search + resolution
│   │   └── InviteLink.tsx         # invite link + Twitter share
│   ├── dispute/
│   │   ├── DisputeFlag.tsx        # anonymous flag submission
│   │   └── DisputeVote.tsx        # encrypted vote UI
│   ├── onboarding/
│   │   ├── WalletGuide.tsx        # 3-step MetaMask setup
│   │   └── InviteLanding.tsx      # invite link recipient page
│   └── shared/
│       ├── Skeleton.tsx           # reusable pulse skeleton
│       ├── LockIcon.tsx           # encrypted state indicator
│       ├── TrustBadge.tsx         # trust tier dot + label
│       ├── Confirmation.tsx       # post-action success screen
│       ├── ErrorState.tsx         # contract error handler
│       ├── NetworkGuard.tsx       # wrong network banner
│       ├── WalletButton.tsx       # RainbowKit connect wrapper
│       └── ThemeToggle.tsx        # light/dark mode switch
├── lib/
│   ├── fhe/
│   │   ├── instance.ts            # singleton FhevmInstance
│   │   ├── encrypt.ts             # encryptAmount() → externalEuint64
│   │   └── decrypt.ts             # revealBalance() via EIP-712
│   ├── contracts/
│   │   ├── abis/                  # ABI JSON files
│   │   ├── addresses.ts           # addresses keyed by chainId
│   │   └── hooks/
│   │       ├── useGroup.ts
│   │       ├── useExpenses.ts
│   │       ├── useBalance.ts
│   │       ├── useSettlement.ts
│   │       └── useTrustScore.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── types.ts
│   └── utils/
│       ├── format.ts              # formatAmount, truncateAddress
│       └── constants.ts
├── hooks/
│   ├── useNotifications.ts
│   └── useWallet.ts
├── store/
│   ├── balance.ts                 # revealed balance cache + auto-lock
│   ├── theme.ts                   # 'light' | 'dark', persisted to localStorage
│   └── notifications.ts
├── types/
│   ├── contracts.ts
│   └── api.ts
└── pages/
    ├── Landing.tsx
    ├── Onboarding.tsx
    ├── Dashboard.tsx
    ├── GroupDetail.tsx
    ├── NewGroup.tsx
    └── Profile.tsx
```

---

## Design Tokens (Tailwind)

Semantic tokens via CSS variables on `:root` / `.dark`. Components use token names, never hardcoded hex.

```js
// tailwind.config.js — map to var(--color-*)
colors: {
  bg, surface, "surface-raised", border, "border-subtle",
  accent, "accent-hover", positive, negative, warning,
  locked, "locked-bg", foreground, muted
}
fontFamily: {
  sans: ["Inter", "system-ui", "sans-serif"],
  mono: ["JetBrains Mono", "monospace"],
}
```

### Dark (default)
```
bg #0A0A0A          surface #111111       surface-raised #1A1A1A
border #2A2A2A      border-subtle #1E1E1E accent #7C5CFC
accent-hover #9070FF positive #22C55E      negative #EF4444
warning #F59E0B     locked #404040         locked-bg #1C1C1C
foreground #FFFFFF  muted #9CA3AF
```

### Light
```
bg #FAFAFA          surface #FFFFFF       surface-raised #F4F4F5
border #E4E4E7      border-subtle #F0F0F0 accent #7C5CFC
accent-hover #9070FF positive #16A34A      negative #DC2626
warning #D97706     locked #A1A1AA         locked-bg #F4F4F5
foreground #0A0A0A  muted #6B7280
```

### Theme toggle
- Default: dark
- First visit (no `localStorage`): respect `prefers-color-scheme`
- Persistence: `localStorage` key `veil-theme`
- Implementation: `class="dark"` on `<html>`; hydrate in `main.tsx` before render
- Placement: app header (desktop), profile or tab bar (mobile)
- State: `store/theme.ts` — `theme`, `setTheme`, `toggleTheme`

---

## Core UI Rules

- Light/dark toggle available; default dark
- Use `text-foreground` / `text-muted` — never hardcoded `text-white`
- Accent colour (#7C5CFC) on CTAs only — nowhere else
- Amounts: always monospace font, tabular-nums, 2 decimal places ($30.00)
- Wallet addresses: always truncated (0xAda...9f12)
- Twitter handles: always prefixed (@ada_eth)
- No amount ever shown in the expense feed — description only
- Balance locked state shows animated pulse bars, never zeros
- Balance auto-locks after exactly 5 minutes — show countdown
- Never show other members' balances or group-wide debt boards

---

## Group Detail Layout

```
GroupDetail
├── BalanceCard          (my balance only)
├── MyActions            (my pending pay/receive actions)
├── ExpenseFeed          (descriptions only)
└── SettlementCard       (only if current user is payer or payee)
```

---

## Loading States (build these into every component)

### Balance Reveal (2–5s Gateway round-trip)
```
idle       → [Reveal balance] button
signing    → "Requesting signature..." + spinner
decrypting → "Decrypting your balance..." + pulsing lock icon
revealed   → amount fades in, 5:00 countdown starts
```

### Add Expense (contract write)
```
idle       → [Add Expense] button active
encrypting → "Encrypting amount..." (instant)
confirming → "Confirm in wallet..." + wallet popup
processing → "Processing..." (no public explorer link)
success    → expense card slides into feed
```

### Settle Up (private token transfer)
```
idle       → [Pay $30.00] button
approving  → "Approve token spend..." + wallet popup
confirming → "Confirming payment..." + wallet popup
success    → participant-scoped success screen
```

### Create Settlement
```
idle       → [Create Settlement] button
computing  → "Computing balances..."
confirming → "Confirm in wallet..."
success    → "Settlement assigned" (participant-scoped, not group-visible)
```

---

## Confirmation Screens (after every key action)

### Expense Added
```
✓  Expense added
   [description]
   Split between [n] members
[View in feed]    [Add another]
```
No amount shown.

### Settlement Paid (payer only)
```
✓  Payment complete
   Paid [name]  $XX.XX
   Trust score updated ↑
[Back to group]
```
Visible only to the payer. Never broadcast to group.

### Group Created
```
🎉  [Group name] created
[Copy invite link]
[Invite via Twitter]
[Start adding expenses]
```

`Confirmation` component accepts `sensitive?: boolean` — when true, lines with amounts render only if `authorized` prop is true.

---

## Error States

| Trigger | Message | Action |
|---------|---------|--------|
| User rejects signature | "Signature cancelled" | Dismiss |
| Transaction fails | "Transaction failed. Your funds are safe." | Retry (no explorer link for private txs) |
| Gateway timeout | "Decryption taking longer than usual" | Auto-retry once |
| Wallet disconnects | Banner: "Wallet disconnected" | Reconnect button |
| Wrong network | "Switch to Sepolia to continue" | One-click switch |
| Handle not found | "@handle hasn't joined Veil yet" | Send invite link |

---

## Wallet Onboarding (no MetaMask installed)

```
Landing page
├── [Connect Wallet]         → RainbowKit modal
├── [Sign in with Twitter]   → lower friction entry
└── Don't have a wallet?
    └── [Get MetaMask →]
          │
          ▼ 3-step guide
        Step 1: Install MetaMask
        Step 2: Add Sepolia network (auto button)
        Step 3: Get test ETH from faucet
```

---

## Invite Link Flow (recipient with no wallet)

```
/invite/[token] → InviteLanding.tsx

Shows:
- "[Name] invited you to [Group]"
- "Split expenses privately"
- [Connect Wallet to Join]
- [Sign in with Twitter first]

After connecting → auto-joins group → group dashboard
```

---

## Skeleton Loaders

Use everywhere data is loading. Pattern:
```tsx
<div className="animate-pulse bg-surface-raised rounded-lg h-16 w-full" />
```

Apply to: group list, expense feed, balance card, my actions list, settlement card.

---

## Mobile Rules

- Balance card: full-width, amount centered, reveal button full-width
- Add Expense: bottom sheet (not a page), amount input auto-focused
- Settle Up: full screen modal, pay button pinned to bottom
- Bottom tab bar on mobile: Home / Groups / Notifications / Profile
- Sidebar only on desktop (lg: breakpoint)
- Theme toggle in profile or tab bar on mobile

---

## Key Conventions

- All FHE calls go through `lib/fhe/` — never inline @fhevm/sdk in components
- Contract addresses from `lib/contracts/addresses.ts` — never hardcoded
- Amounts stored/sent as cents (×100), displayed as dollars (÷100)
- Use `useReadContract` for reads, `useWriteContract` for writes
- TanStack Query for all async data — no useEffect for fetching
- Zustand for: revealed balance cache, notification state, theme preference
- `useBalance` returns `{ myBalanceHandle, myActions }` — never `breakdown[]` of other members
- Theme via `store/theme.ts`; never `prefers-color-scheme` alone after first load
- Skeleton loaders instead of null/undefined checks in JSX
- Every component handles: loading, error, empty, and data states
- No public block explorer links for private contract writes or settlements
