#!/usr/bin/env bash
# Deploy Veil contracts to Sepolia (FHEVM host stack is pre-deployed on-chain).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "$ROOT/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${RPC_URL:?Set RPC_URL in contracts/.env (see .env.example)}"
: "${PRIVATE_KEY:?Set PRIVATE_KEY in contracts/.env — deployer wallet needs Sepolia ETH}"

CHAIN_ID="${CHAIN_ID:-11155111}"
VERIFY_ARGS=()
if [[ -n "${ETHERSCAN_API_KEY:-}" ]]; then
  VERIFY_ARGS=(--verify --etherscan-api-key "$ETHERSCAN_API_KEY")
fi

echo "Deploying to Sepolia (chain ${CHAIN_ID})..."
FORGE_EXIT=0
if ((${#VERIFY_ARGS[@]})); then
  forge script script/Deploy.s.sol \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    "${VERIFY_ARGS[@]}" || FORGE_EXIT=$?
else
  forge script script/Deploy.s.sol \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast || FORGE_EXIT=$?
fi

BROADCAST="broadcast/Deploy.s.sol/${CHAIN_ID}/run-latest.json"
if [[ ! -f "$BROADCAST" ]]; then
  echo "Broadcast artifact missing: $BROADCAST" >&2
  exit 1
fi

GROUP_REGISTRY="$(jq -r '.transactions[] | select(.contractName == "GroupRegistry") | .contractAddress' "$BROADCAST" | head -1)"
CONFIDENTIAL_LEDGER="$(jq -r '.transactions[] | select(.contractName == "ConfidentialLedger") | .contractAddress' "$BROADCAST" | head -1)"
SETTLEMENTS="$(jq -r '.transactions[] | select(.contractName == "Settlements") | .contractAddress' "$BROADCAST" | head -1)"

if [[ -z "$GROUP_REGISTRY" || "$GROUP_REGISTRY" == "null" ]]; then
  echo "Could not parse deployed addresses from $BROADCAST" >&2
  exit 1
fi

if ((FORGE_EXIT != 0)); then
  echo "Note: forge exited ${FORGE_EXIT} (often an FHEVM RPC receipt-format warning)."
  echo "Addresses below were read from the broadcast artifact — verify on Sepolia if unsure."
  echo ""
fi

echo ""
echo "Deployed:"
echo "  GroupRegistry:      $GROUP_REGISTRY"
echo "  ConfidentialLedger: $CONFIDENTIAL_LEDGER"
echo "  Settlements:        $SETTLEMENTS"
echo ""

ENV_FILE="$REPO_ROOT/.env"
if [[ -f "$ENV_FILE" ]]; then
  update_env() {
    local key="$1"
    local value="$2"
    if grep -q "^${key}=" "$ENV_FILE"; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
      printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
    fi
  }
  update_env VITE_GROUP_REGISTRY_ADDRESS "$GROUP_REGISTRY"
  update_env VITE_CONFIDENTIAL_LEDGER_ADDRESS "$CONFIDENTIAL_LEDGER"
  update_env VITE_SETTLEMENTS_ADDRESS "$SETTLEMENTS"
  echo "Updated $ENV_FILE with contract addresses."
  echo "Restart the Vite dev server to pick up changes."
else
  cat <<EOF
Add to your frontend .env:

VITE_GROUP_REGISTRY_ADDRESS=$GROUP_REGISTRY
VITE_CONFIDENTIAL_LEDGER_ADDRESS=$CONFIDENTIAL_LEDGER
VITE_SETTLEMENTS_ADDRESS=$SETTLEMENTS
EOF
fi
