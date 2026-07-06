import { useState } from 'react'
import { WalletGuide } from './WalletGuide.tsx'
import { SectionCard } from '../shared/SectionCard.tsx'
import { Stepper } from '../shared/Stepper.tsx'
import { WalletButton } from '../shared/WalletButton.tsx'
import { useAuth } from '../../hooks/useAuth.ts'
import { useWallet } from '../../hooks/useWallet.ts'
import { toast } from '../../store/toast.ts'

const STEPS = ['Wallet', 'Sign in', 'Identity', 'Ready']

function normalizeHandleInput(raw: string): string {
  return raw.trim().replace(/^@/, '').toLowerCase()
}

function stepIndex(
  step: 'connect' | 'signin' | 'profile' | 'launch' | 'done',
): number {
  switch (step) {
    case 'connect':
      return 0
    case 'signin':
      return 1
    case 'profile':
      return 2
    case 'launch':
    case 'done':
      return 3
    default:
      return 0
  }
}

export function useOnboardingStep() {
  const { address, isConnected, chainId } = useWallet()
  const auth = useAuth(address, chainId)

  const step: 'connect' | 'signin' | 'profile' | 'launch' | 'done' = !isConnected
    ? 'connect'
    : !auth.isAuthenticated
      ? 'signin'
      : !auth.hasProfile
        ? 'profile'
        : 'launch'

  const isComplete = isConnected && auth.isAuthenticated && auth.hasProfile
  const isLoading = isConnected && auth.isLoading

  return { step, currentStep: stepIndex(step), isComplete, isLoading, address, auth }
}

export function OnboardingSetup() {
  const { step, currentStep, address, auth } = useOnboardingStep()
  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [busy, setBusy] = useState(false)
  const [showWalletHelp, setShowWalletHelp] = useState(false)

  const handleSignIn = async () => {
    setBusy(true)
    try {
      await auth.signIn()
      toast.success('Signed in with Ethereum')
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'api_unreachable'
          ? 'Backend unreachable. Run: cd backend && npm run start'
          : 'Sign-in failed. Confirm Sepolia network and try again.'
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  const handleSaveProfile = async () => {
    const name = displayName.trim()
    const chosenHandle = normalizeHandleInput(handle)
    if (!name || chosenHandle.length < 3) {
      toast.error('Enter a name and handle (3+ characters)')
      return
    }

    setBusy(true)
    try {
      await auth.completeProfile({ displayName: name, handle: chosenHandle })
      toast.success('Profile created')
    } catch {
      toast.error('Could not save profile. Handle may be taken.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Get started</h2>
        <p className="mt-2 text-sm text-muted">
          Connect your wallet, sign in, and pick your @handle. Other sections unlock when
          setup is complete.
        </p>
      </div>

      <div className="mb-8">
        <Stepper steps={STEPS} current={currentStep} />
      </div>

      {step === 'connect' && (
        <>
          <SectionCard title="Step 1: Connect wallet" className="mb-6">
            <p className="mb-4 text-sm text-muted">
              Veil runs on Sepolia. Connect your wallet to continue.
            </p>
            <WalletButton />
            <p className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => setShowWalletHelp((v) => !v)}
                className="text-accent underline-offset-2 hover:underline"
              >
                {showWalletHelp
                  ? 'Hide wallet setup help'
                  : 'Need MetaMask or Sepolia test ETH?'}
              </button>
            </p>
          </SectionCard>
          {showWalletHelp && (
            <WalletGuide
              onAddSepolia={() => {}}
              onOpenFaucet={() => window.open('https://sepoliafaucet.com', '_blank', 'noopener')}
            />
          )}
        </>
      )}

      {step === 'signin' && (
        <SectionCard title="Step 2: Sign in with Ethereum">
          <p className="mb-2 text-sm text-muted">
            Prove wallet ownership with a one-time signature. No gas fee.
          </p>
          <p className="mb-4 font-mono text-xs text-foreground">{address}</p>
          <button
            type="button"
            onClick={() => void handleSignIn()}
            disabled={busy}
            className="veil-btn-primary w-full"
          >
            {busy ? 'Waiting for signature…' : 'Sign message'}
          </button>
        </SectionCard>
      )}

      {step === 'profile' && (
        <SectionCard title="Step 3: Choose your identity">
          <p className="mb-4 text-sm text-muted">
            Your display name and @handle are bound to this wallet across all groups.
          </p>
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="mb-1.5 block text-sm text-muted">
                Display name
              </label>
              <input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ada"
                className="veil-input w-full"
                autoComplete="nickname"
              />
            </div>
            <div>
              <label htmlFor="handle" className="mb-1.5 block text-sm text-muted">
                Handle
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  @
                </span>
                <input
                  id="handle"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="ada_eth"
                  className="veil-input w-full pl-8"
                  autoComplete="username"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Lowercase letters, numbers, underscores. 3 to 32 characters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleSaveProfile()}
              disabled={busy}
              className="veil-btn-primary w-full"
            >
              {busy ? 'Saving…' : 'Save identity'}
            </button>
          </div>
        </SectionCard>
      )}

      {step === 'launch' && (
        <SectionCard title="Step 4: You're ready">
          <p className="text-sm text-muted">
            Setup complete. Create a group, add expenses, and track repayments from your dashboard.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            <li className="flex gap-2">
              <span className="text-accent">→</span>
              Dashboard shows cross-group balances and activity
            </li>
            <li className="flex gap-2">
              <span className="text-accent">→</span>
              Create a group with on-chain membership
            </li>
            <li className="flex gap-2">
              <span className="text-accent">→</span>
              Add expenses with encrypted splits
            </li>
          </ul>
        </SectionCard>
      )}
    </div>
  )
}
