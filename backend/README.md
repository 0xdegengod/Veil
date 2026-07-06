# Veil Backend (Hono · Drizzle · Postgres)

Off-chain **metadata** API. Stores identities, group names/descriptions, invites, and
action-only notifications. **Never stores plaintext amounts** — encrypted balances and
settlement amounts live on-chain as ciphertext handles (see `../contracts`).

## Stack
- [Hono](https://hono.dev) HTTP framework on `@hono/node-server`
- [Drizzle ORM](https://orm.drizzle.team) + `pg` (Postgres)
- `zod` request validation
- `tsx` for dev/run (Node 23)

## Setup (local dev)

```bash
cp .env.example .env
docker compose up -d          # merges docker-compose.override.yml
npm install
npm run db:push               # create tables from src/db/schema.ts
npm run dev                   # http://localhost:8787  (or: npm start)
```

- Postgres: **localhost:5432** (dev credentials `veil` / `veil`)
- pgweb: **http://localhost:8081** — browse tables; dev only, never expose publicly

Compose layout:

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base Postgres (internal network, no published ports) |
| `docker-compose.override.yml` | Dev overlay — publishes `:5432` and starts pgweb (auto-merged) |
| `docker-compose.prod.yml` | Prod overlay — strong `POSTGRES_PASSWORD`, no pgweb, no published DB port |

## Setup (production)

```bash
export POSTGRES_PASSWORD="$(openssl rand -base64 32)"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Set `DATABASE_URL` to `postgres://veil:<POSTGRES_PASSWORD>@postgres:5432/veil` for the API
process. Postgres is reachable only inside the Compose network — use SSH tunnel or a managed
DB console if you need ad-hoc SQL access.

## Data model (`src/db/schema.ts`)

| Table | Purpose |
|-------|---------|
| `profiles` | wallet → twitter handle, display name |
| `groups` | name, description, invite token, settlement token/cadence, admin, optional `chain_group_id` |
| `group_members` | membership cache + handle/trust-tier for fast reads |
| `invites` | invite token → group + inviter |
| `notifications` | per-recipient, action-only messages (no amounts) |
| `expenses` | description, payer, optional `chain_expense_id` — **no amounts** |
| `expense_participants` | who was in each split (ACL hints for the client) |
| `settlements` | payer/payee pairs, optional `chain_settlement_id`, cutoff date — **no amounts** |

## Auth (SIWE v1)

1. `GET /auth/nonce?address=0x..` — issue a one-time nonce (public)
2. Client signs an [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) message
3. `POST /auth/verify` — `{ message, signature }` → `{ token, hasProfile, profile }`
4. Send `Authorization: Bearer <token>` on all other routes (7-day JWT)

Configure `JWT_SECRET`, `SIWE_DOMAIN`, `SIWE_URI`, and `CHAIN_ID` in `.env`. Frontend
`VITE_SIWE_*` must match.

**Onboarding:** after SIWE, `PUT /profiles` with `{ displayName, handle }` binds the
chosen name to the wallet. Handle is unique (`^[a-z0-9_]{3,32}$`).

## Chain-first indexing

Metadata POST routes require on-chain ids from a mined tx:

| Route | Required field |
|-------|----------------|
| `POST /groups` | `chainGroupId` |
| `POST /groups/:id/expenses` | `chainExpenseId` |
| `POST /groups/:id/settlements` | `chainSettlementId` |

Flow: **chain tx → POST metadata with id**. Caller wallet comes from the SIWE session.

## API

| Method | Path | Notes |
|--------|------|-------|
| `GET`  | `/health` | liveness |
| `GET`  | `/profiles?q=handle` | search profiles for member picker |
| `GET`  | `/profiles/:address` | fetch profile |
| `PUT`  | `/profiles` | upsert `{ walletAddress, twitterHandle, displayName }` |
| `GET`  | `/groups?wallet=0x..` | groups the wallet belongs to |
| `GET`  | `/groups/:id` | `{ group, members }` |
| `POST` | `/groups` | create `{ name, adminAddress, members[], settlementToken?, cadence?, description? }` |
| `PATCH`| `/groups/:id` | rename `{ name }` |
| `PATCH`| `/groups/:id/chain` | link `{ chainGroupId }` (admin, `X-Wallet-Address`) |
| `PATCH`| `/groups/:id/admin` | transfer `{ adminAddress }` (admin, `X-Wallet-Address`) |
| `POST` | `/groups/:id/members` | add `{ walletAddress, handle, trustTier? }` |
| `DELETE` | `/groups/:id/members/:wallet` | remove member |
| `GET`  | `/groups/:groupId/expenses?wallet=0x..` | expense feed (metadata) |
| `GET`  | `/groups/:groupId/expenses/:expenseId?wallet=0x..` | detail shell + scoped participants |
| `POST` | `/groups/:groupId/expenses` | index expense (`X-Wallet-Address` = payer) |
| `PATCH`| `/groups/:groupId/expenses/:expenseId/chain` | link `{ chainExpenseId }` |
| `GET`  | `/groups/:groupId/settlements?wallet=0x..` | settlements involving caller |
| `POST` | `/groups/:groupId/settlements` | index settlement (`X-Wallet-Address` = payer) |
| `PATCH`| `/groups/:groupId/settlements/:settlementId/chain` | link `{ chainSettlementId }` |
| `GET`  | `/dashboard?wallet=0x..` | cross-group activity index (no amounts) |
| `GET`  | `/invites/:token` | resolve invite → group summary |
| `POST` | `/invites/:token/accept` | join group (`X-Wallet-Address`) |
| `GET`  | `/notifications?wallet=0x..` | list (newest first) |
| `POST` | `/notifications` | create action-only notification |
| `POST` | `/notifications/:id/read` | mark read |
| `POST` | `/notifications/read-all?wallet=0x..` | mark all read |

Addresses are normalized to lowercase server-side.

## Migrations

`npm run db:push` syncs the schema directly (dev). For versioned migrations:
`npm run db:generate` then `npm run db:migrate`.
