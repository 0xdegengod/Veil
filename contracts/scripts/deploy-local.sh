#!/usr/bin/env bash
# Local Anvil deploy — FHEVM host stack + Veil contracts (chain 31337).
# Frontend is Sepolia-only today; use this for contract dev / forge tests.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ANVIL_PORT="${ANVIL_PORT:-8545}"
RPC_URL="http://127.0.0.1:${ANVIL_PORT}"
# Anvil account #0
PRIVATE_KEY="${PRIVATE_KEY:-0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80}"
FHEVM_DEPLOY="$ROOT/dependencies/forge-fhevm-eba2324/deploy-local.sh"
FHEVM_DIR="$ROOT/dependencies/forge-fhevm-eba2324"

if [[ ! -f "$FHEVM_DIR/dependencies/@fhevm-solidity-0.11.1/lib/FHE.sol" ]]; then
  echo "Installing forge-fhevm dependencies (one-time)..."
  (cd "$FHEVM_DIR" && forge soldeer install)
fi

if ! curl -sf "$RPC_URL" -X POST -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
  echo "Starting Anvil on port ${ANVIL_PORT}..."
  anvil --port "$ANVIL_PORT" >/tmp/veil-anvil.log 2>&1 &
  ANVIL_PID=$!
  trap 'kill "$ANVIL_PID" 2>/dev/null || true' EXIT
  for _ in $(seq 1 30); do
    if curl -sf "$RPC_URL" -X POST -H 'Content-Type: application/json' \
      -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' >/dev/null; then
      break
    fi
    sleep 0.2
  done
fi

echo "Deploying FHEVM host stack to ${RPC_URL}..."
"$FHEVM_DEPLOY" --rpc-url "$RPC_URL" -v

echo "Deploying Veil contracts..."
forge script script/Deploy.s.sol \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast

CHAIN_ID=31337
BROADCAST="broadcast/Deploy.s.sol/${CHAIN_ID}/run-latest.json"
GROUP_REGISTRY="$(jq -r '.transactions[] | select(.contractName == "GroupRegistry") | .contractAddress' "$BROADCAST" | head -1)"
CONFIDENTIAL_LEDGER="$(jq -r '.transactions[] | select(.contractName == "ConfidentialLedger") | .contractAddress' "$BROADCAST" | head -1)"
SETTLEMENTS="$(jq -r '.transactions[] | select(.contractName == "Settlements") | .contractAddress' "$BROADCAST" | head -1)"

echo ""
echo "Local deploy complete (chain ${CHAIN_ID}):"
echo "  GroupRegistry:      $GROUP_REGISTRY"
echo "  ConfidentialLedger: $CONFIDENTIAL_LEDGER"
echo "  Settlements:        $SETTLEMENTS"
echo ""
echo "RPC: ${RPC_URL}"
