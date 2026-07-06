/**
 * Zama network reference — https://docs.zama.org/protocol/protocol-apps/chains
 *
 * Veil contracts + wagmi wallet txs use **Ethereum Sepolia** (11155111).
 * Do not point wagmi at Gateway or the legacy devnet.
 */
export const ZAMA_NETWORKS = {
  /** Where GroupRegistry / ConfidentialLedger / Settlements live */
  sepolia: {
    chainId: 11155111,
    /** Default app RPC — override with VITE_SEPOLIA_RPC_URL */
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  },
  /** FHE relayer (browser encrypt/decrypt — wired in lib/fhe/ later) */
  relayerUrl: 'https://relayer.testnet.zama.org',
  /** Gateway coprocessor chain — not for wagmi / contract calls */
  gatewayTestnet: {
    chainId: 10901,
    rpcUrl: 'https://rpc.testnet.zama.org',
  },
  /**
   * Legacy standalone devnet — deprecated, no longer supported by Zama.
   * https://devnet.zama.ai does not replace Sepolia for FHEVM v0.11+.
   */
  legacyDevnetUrl: 'https://devnet.zama.ai',
} as const
