type WalletGuideProps = {
  onAddSepolia: () => void
  onOpenFaucet: () => void
}

export function WalletGuide({ onAddSepolia, onOpenFaucet }: WalletGuideProps) {
  const steps = [
    {
      step: '1',
      title: 'Install MetaMask',
      description: 'Browser extension for Ethereum wallets',
      action: (
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noreferrer"
          className="veil-btn-primary inline-block"
        >
          Get MetaMask
        </a>
      ),
    },
    {
      step: '2',
      title: 'Add Sepolia network',
      description: 'Veil runs on Sepolia testnet',
      action: (
        <button type="button" onClick={onAddSepolia} className="veil-btn-primary">
          Add Sepolia
        </button>
      ),
    },
    {
      step: '3',
      title: 'Get test ETH',
      description: 'Free from a Sepolia faucet',
      action: (
        <button type="button" onClick={onOpenFaucet} className="veil-btn-secondary">
          Open faucet
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4 text-left">
      {steps.map((s) => (
        <div
          key={s.step}
          className="flex gap-4 rounded-2xl border border-border bg-surface p-5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border font-mono text-xs text-muted">
            {s.step}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-foreground">{s.title}</h3>
            <p className="mt-1 text-sm text-muted">{s.description}</p>
            <div className="mt-4">{s.action}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
