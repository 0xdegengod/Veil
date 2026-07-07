#!/usr/bin/env bash
# Deploy MockUSDC to Sepolia and wire the frontend + backend USDC address.
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

: "${RPC_URL:?Set RPC_URL in contracts/.env}"
: "${PRIVATE_KEY:?Set PRIVATE_KEY in contracts/.env}"

CHAIN_ID="${CHAIN_ID:-11155111}"

echo "Deploying MockUSDC to Sepolia (chain ${CHAIN_ID})..."
forge script script/DeployMockUSDC.s.sol \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast

BROADCAST="broadcast/DeployMockUSDC.s.sol/${CHAIN_ID}/run-latest.json"
MOCK_USDC="$(jq -r '.transactions[] | select(.contractName == "MockUSDC") | .contractAddress' "$BROADCAST" | head -1)"

if [[ -z "$MOCK_USDC" || "$MOCK_USDC" == "null" ]]; then
  echo "Could not parse MockUSDC address from $BROADCAST" >&2
  exit 1
fi

echo ""
echo "MockUSDC deployed: $MOCK_USDC"
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
  update_env VITE_SEPOLIA_USDC_ADDRESS "$MOCK_USDC"
  update_env VITE_USDC_FAUCET_MINT "true"
  echo "Updated $ENV_FILE"
  echo "Restart the Vite dev server and backend."
else
  cat <<EOF
Add to your frontend .env:

VITE_SEPOLIA_USDC_ADDRESS=$MOCK_USDC
VITE_USDC_FAUCET_MINT=true
EOF
fi
