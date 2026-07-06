import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { createConfig, http } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { sepolia } from 'wagmi/chains'
import { ZAMA_NETWORKS } from '../zama/network.ts'

/** Sepolia RPC for wallet reads + txs. Not devnet.zama.ai (deprecated) or rpc.testnet.zama.org (Gateway chain). */
const SEPOLIA_RPC_URL =
  import.meta.env.VITE_SEPOLIA_RPC_URL?.trim() || ZAMA_NETWORKS.sepolia.rpcUrl

const sepoliaTransport = http(SEPOLIA_RPC_URL)

function resolveWalletConnectProjectId(): string | undefined {
  const raw = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim()
  if (!raw || raw === 'YOUR_PROJECT_ID') return undefined
  return raw
}

const walletConnectProjectId = resolveWalletConnectProjectId()

/**
 * WalletConnect requires a Cloud projectId. When unset, use injected +
 * browser extension wallets (Rabby, MetaMask) — sufficient for local Sepolia dev.
 */
export const wagmiConfig = walletConnectProjectId
  ? getDefaultConfig({
      appName: 'Veil',
      appDescription: 'Confidential group expense splitting',
      projectId: walletConnectProjectId,
      chains: [sepolia],
      transports: {
        [sepolia.id]: sepoliaTransport,
      },
      ssr: false,
    })
  : createConfig({
      chains: [sepolia],
      connectors: [
        injected({ target: 'rabby' }),
        metaMask(),
        injected({ target: 'metaMask' }),
        injected(),
      ],
      transports: {
        [sepolia.id]: sepoliaTransport,
      },
    })
