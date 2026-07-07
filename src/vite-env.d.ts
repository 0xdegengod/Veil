/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_SIWE_DOMAIN?: string
  readonly VITE_SIWE_URI?: string
  readonly VITE_GROUP_REGISTRY_ADDRESS?: string
  readonly VITE_CONFIDENTIAL_LEDGER_ADDRESS?: string
  readonly VITE_SETTLEMENTS_ADDRESS?: string
  readonly VITE_SIWE_CHAIN_ID?: string
  readonly VITE_SEPOLIA_RPC_URL?: string
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string
  readonly VITE_ETH_USD_PRICE?: string
  readonly VITE_SEPOLIA_USDC_ADDRESS?: string
  readonly VITE_SEPOLIA_CONFIDENTIAL_USDC_ADDRESS?: string
  readonly VITE_USDC_FAUCET_MINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
