import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import {
  CIRCLE_USDC_FAUCET_URL,
  SEPOLIA_ETH_FAUCET_URL,
  USDC_FAUCET_MINT_AMOUNT,
  USDC_FAUCET_MINT_ENABLED,
} from '../../lib/constants/app.ts'
import { mintTestUsdc } from '../../lib/payments/mintTestUsdc.ts'
import { toast } from '../../store/toast.ts'

type TestTokenFaucetProps = {
  compact?: boolean
}

const btnCompact =
  'flex-1 rounded-lg border px-2 py-1.5 text-center text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50'

export function TestTokenFaucet({ compact = false }: TestTokenFaucetProps) {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const [minting, setMinting] = useState(false)

  const handleMint = async () => {
    if (!address) return
    setMinting(true)
    try {
      await mintTestUsdc(address)
      await queryClient.invalidateQueries()
      toast.success(`Minted ${USDC_FAUCET_MINT_AMOUNT} test USDC to your wallet`)
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      if (code === 'wallet_not_connected') {
        toast.error('Connect your wallet first')
      } else {
        toast.error('Mint failed. Try the Circle faucet link.')
      }
    } finally {
      setMinting(false)
    }
  }

  if (compact) {
    return (
      <div className="flex gap-2">
        {USDC_FAUCET_MINT_ENABLED ? (
          <button
            type="button"
            onClick={() => void handleMint()}
            disabled={!isConnected || minting}
            className={`${btnCompact} border-accent/40 bg-accent/10 text-foreground hover:bg-accent/20`}
          >
            {minting ? 'Minting…' : `Mint ${USDC_FAUCET_MINT_AMOUNT} USDC`}
          </button>
        ) : (
          <a
            href={CIRCLE_USDC_FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className={`${btnCompact} border-accent/40 bg-accent/10 text-foreground hover:bg-accent/20`}
          >
            Get test USDC
          </a>
        )}

        <a
          href={SEPOLIA_ETH_FAUCET_URL}
          target="_blank"
          rel="noreferrer"
          className={`${btnCompact} border-border-subtle bg-surface text-muted hover:border-border hover:text-foreground`}
        >
          Get Sepolia ETH
        </a>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface/60 p-4 text-left">
      <p className="font-medium text-foreground">Test tokens on Sepolia</p>
      <p className="mt-1 text-sm text-muted">
        cUSD wraps test USDC into an encrypted token. You also need Sepolia ETH for gas.
      </p>

      <div className="mt-4 flex gap-2">
        {USDC_FAUCET_MINT_ENABLED ? (
          <button
            type="button"
            onClick={() => void handleMint()}
            disabled={!isConnected || minting}
            className="veil-btn-primary flex-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {minting ? 'Minting…' : `Mint ${USDC_FAUCET_MINT_AMOUNT} USDC`}
          </button>
        ) : (
          <a
            href={CIRCLE_USDC_FAUCET_URL}
            target="_blank"
            rel="noreferrer"
            className="veil-btn-primary flex-1 text-center text-sm"
          >
            Get test USDC
          </a>
        )}

        <a
          href={SEPOLIA_ETH_FAUCET_URL}
          target="_blank"
          rel="noreferrer"
          className="veil-btn-secondary flex-1 text-center text-sm"
        >
          Get Sepolia ETH
        </a>
      </div>

      {!USDC_FAUCET_MINT_ENABLED && (
        <p className="mt-2 text-[11px] text-muted">
          Or deploy MockUSDC with{' '}
          <code className="font-mono text-foreground/80">./scripts/deploy-mock-usdc-sepolia.sh</code>{' '}
          to enable one-click mint in the app.
        </p>
      )}
    </div>
  )
}
