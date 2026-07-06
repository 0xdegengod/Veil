# Veil Contracts (FHEVM · Foundry)

Confidential expense-splitting contracts built on [Zama FHEVM](https://docs.zama.org/protocol).
Encrypted balances and settlement amounts live on-chain as ciphertext handles; only the
ACL-authorized party can decrypt their own data.

## Contracts

| Contract | Responsibility | Privacy |
|----------|----------------|---------|
| `GroupRegistry.sol` | Plaintext membership + admin authority. Names/descriptions live off-chain. | Public membership only |
| `ConfidentialLedger.sol` | Per-member encrypted `paid` / `owed` accumulators; per-expense total + shares. Net = paid − owed. | Aggregate handles: **member only**. Per expense: payer sees full split; each **participant** sees total + own share; observers see neither |
| `Settlements.sol` | Encrypted payer→payee settlement instructions + paid flag. | Amount decryptable by **payer + payee only** |

### Why two accumulators instead of one signed balance?
FHE `euint` types are unsigned. Rather than encode a signed net balance, we keep unsigned
`paid` and `owed` per member. The frontend user-decrypts both handles and computes the signed
net locally. This keeps homomorphic ops simple and preserves the invariant that no one can
read another member's balance.

## Setup

Requires [Foundry](https://book.getfoundry.sh/) (`forge 1.6+`).

```bash
forge soldeer install   # fetches forge-fhevm, @fhevm/solidity, encrypted-types, OZ, forge-std
forge build
forge test -vvv
```

> Dependency versions are pinned in `foundry.toml` / `remappings.txt`, copied verbatim from the
> official [`fhevm-foundry-template`](https://github.com/zama-ai/fhevm-foundry-template).
> If `forge soldeer install` stalls, it's usually a transient Soldeer registry issue — re-run it;
> already-downloaded deps are cached under `dependencies/`.

## Tests

`forge-fhevm` deploys the real FHEVM host contracts (`FHEVMExecutor`, `ACL`, `InputVerifier`,
`KMSVerifier`) in-test and tracks plaintext locally so you can `assertEq` on decrypted values.

- `GroupRegistry.t.sol` — membership, admin transfer, remove guards (plain Forge).
- `ConfidentialLedger.t.sol` — encrypt → record expense → user-decrypt `paid`/`owed`; participant decrypts expense total; non-member revert.
- `Settlements.t.sol` — payer + payee can decrypt amount; `markPaid` is payer-only; non-member revert.

## Deploy

Veil uses [Zama FHEVM](https://docs.zama.org/protocol/solidity-guides/development-guide/foundry/deploy).
On **Sepolia**, the FHEVM host contracts are already deployed — only the three Veil contracts
need broadcasting. `ConfidentialLedger` and `Settlements` inherit `ZamaEthereumConfig` and
pick up host addresses automatically.

### Sepolia (matches the frontend)

1. Fund a deployer wallet with [Sepolia ETH](https://sepoliafaucet.com/).
2. Configure credentials:

```bash
cp .env.example .env
# edit .env — set RPC_URL and PRIVATE_KEY (never commit .env)
```

3. Deploy and sync addresses into the repo root `.env`:

```bash
./scripts/deploy-sepolia.sh
```

4. Restart the Vite dev server so `VITE_*_ADDRESS` vars load.

Optional: set `ETHERSCAN_API_KEY` in `contracts/.env` to verify on Etherscan after broadcast.

### Local Anvil (contract dev only)

The frontend is Sepolia-only today. Use local deploy for Forge/integration testing:

```bash
./scripts/deploy-local.sh
```

This starts Anvil (if needed), materializes the FHEVM host stack via `forge-fhevm`'s
`deploy-local.sh`, then broadcasts `Deploy.s.sol`.

### Manual (either network)

```bash
forge script script/Deploy.s.sol \
  --rpc-url "$RPC_URL" --broadcast --private-key "$PRIVATE_KEY"
```
