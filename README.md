# Veil

Veil is a confidential group expense app built on [Zama FHEVM](https://docs.zama.org/protocol). Split bills with friends, track who owes what, and settle up without exposing everyone's balances to the group or a central server.

Sensitive amounts stay encrypted on-chain. The backend stores only metadata: group names, expense descriptions, handles, and action-only notifications. Each member decrypts their own balance when they choose to reveal it.

## What you can do

- Create groups and invite members by link
- Add expenses and split them across members
- View encrypted balances and reveal your own net position
- Pay owed shares with Sepolia ETH
- Get repayment reminders and activity across groups
- Sign in with Ethereum (SIWE) and pick a unique handle

## How it works

Veil has three parts:

| Part | Stack | Role |
|------|-------|------|
| **Frontend** (`/`) | React, Vite, wagmi, RainbowKit | Wallet connection, SIWE auth, FHE decrypt, on-chain writes |
| **Backend** (`/backend`) | Hono, Drizzle, Postgres | Profiles, groups, invites, expense metadata, notifications |
| **Contracts** (`/contracts`) | Foundry, FHEVM | Group membership, encrypted ledger, settlements |

Typical flow: sign a chain transaction first, then index metadata in the API. Amounts never land in Postgres as plaintext.

## Prerequisites

- **Node.js** 20+ (backend tested on Node 23)
- **npm**
- **Docker** (for local Postgres)
- **MetaMask** or another injected wallet on **Sepolia**
- **Foundry** (`forge` 1.6+) if you deploy contracts yourself

## Local setup

Run these from the repo root unless noted.

### 1. Contracts (Sepolia)

Skip this if you already have deployed addresses.

```bash
cd contracts
cp .env.example .env
# Set RPC_URL and PRIVATE_KEY in .env
forge soldeer install
forge build
./scripts/deploy-sepolia.sh
```

The deploy script writes contract addresses into the root `.env`. See [`contracts/README.md`](contracts/README.md) for details.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Set JWT_SECRET (e.g. openssl rand -base64 32)
docker compose up -d
npm install
npm run db:push
npm run dev
```

API runs at **http://localhost:8787**. Postgres is on **localhost:5432** (`veil` / `veil`).

### 3. Frontend

```bash
cp .env.example .env
npm install
npm run dev
```

App runs at **http://localhost:5173**.

Set these in `.env` before starting:

```bash
VITE_API_URL=http://localhost:8787
VITE_SIWE_DOMAIN=localhost:5173
VITE_SIWE_URI=http://localhost:5173
VITE_SIWE_CHAIN_ID=11155111
VITE_GROUP_REGISTRY_ADDRESS=0x...
VITE_CONFIDENTIAL_LEDGER_ADDRESS=0x...
VITE_SETTLEMENTS_ADDRESS=0x...
```

`VITE_SIWE_*` must match `SIWE_DOMAIN`, `SIWE_URI`, and `CHAIN_ID` in `backend/.env`.

### 4. First run in the browser

1. Open http://localhost:5173
2. Connect a Sepolia wallet
3. Sign in with Ethereum and choose a handle
4. Create a group or accept an invite
5. Add an expense and reveal your balance when prompted

## Environment files

| File | Purpose |
|------|---------|
| `.env.example` | Frontend: API URL, SIWE, contract addresses, optional WalletConnect |
| `backend/.env.example` | Database, JWT, CORS, SIWE chain config |
| `contracts/.env.example` | Sepolia RPC and deployer key |

Never commit `.env` files. They are gitignored.

## Scripts

**Frontend** (repo root):

```bash
npm run dev       # dev server on :5173
npm run build     # production build
npm run lint      # ESLint
npm run preview   # preview production build
```

**Backend** (`backend/`):

```bash
npm run dev         # watch mode
npm run start       # run once
npm run db:push     # sync schema to Postgres (dev)
npm run typecheck   # TypeScript check
```

**Contracts** (`contracts/`):

```bash
forge test -vvv     # run contract tests
forge build         # compile
```

## Project layout

```
.
├── src/              # React app (pages, components, hooks, API client)
├── backend/          # Hono API + Drizzle schema
├── contracts/        # Foundry project (GroupRegistry, ConfidentialLedger, Settlements)
├── public/           # Static assets
└── .env.example      # Frontend env template
```

## Further reading

- [`backend/README.md`](backend/README.md) — API routes, auth, database schema
- [`contracts/README.md`](contracts/README.md) — contract design, tests, deploy scripts
- [Zama FHEVM docs](https://docs.zama.org/protocol)

## Network

Veil targets **Ethereum Sepolia** (chain id `11155111`). The frontend is Sepolia-only today.
