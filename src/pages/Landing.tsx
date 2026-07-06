import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { VeilLogo } from '../components/shared/VeilLogo.tsx'
import { WalletButton } from '../components/shared/WalletButton.tsx'
import { LandingSectionHeader } from '../components/landing/LandingSectionHeader.tsx'
import {
  FaqList,
  FeatureShowcase,
  HeroVisual,
  HowItWorksFlow,
  PrivacyRoles,
  ProblemCompare,
} from '../components/landing/LandingVisuals.tsx'
import { MobileScrollProgress } from '../components/landing/MobileScrollProgress.tsx'
import { RevealItem, RevealSection } from '../components/landing/RevealSection.tsx'
import { ScrollTimeline } from '../components/landing/ScrollTimeline.tsx'
const privacyRows = [
  { role: 'Group member', sees: 'Expense descriptions only', hidden: 'All amounts' },
  { role: 'Split participant', sees: 'Total + your share', hidden: "Others' shares" },
  { role: 'Payer', sees: 'Full split + who paid back', hidden: "Others' group balances" },
]

const features = [
  {
    title: 'Encrypted amounts',
    description:
      'Every balance and share is stored as FHE ciphertext on-chain. Only wallets with ACL permission can decrypt.',
  },
  {
    title: 'Per-expense visibility',
    description:
      'Payers see the full split. Participants see the total and their row. Everyone else sees descriptions only.',
  },
  {
    title: 'Cross-group dashboard',
    description:
      "One view of what you owe, what you're owed, and outstanding repayments across every group.",
  },
  {
    title: 'Handle-based identity',
    description:
      "Pick a @handle during onboarding. It's bound to your wallet.",
  },
  {
    title: 'SIWE authentication',
    description:
      'Sign in with Ethereum. Sessions are JWT-backed. No trusted headers or plaintext secrets.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Create a group',
    body: 'Deploy membership on-chain with GroupRegistry. Index the group name and settings in Veil.',
  },
  {
    n: '02',
    title: 'Add expenses',
    body: 'Record encrypted splits on ConfidentialLedger. Descriptions stay off-chain. Amounts never hit the database.',
  },
  {
    n: '03',
    title: 'Repay shares',
    body: 'Send Sepolia ETH to the payer. Activity and awaiting-from-others update across groups.',
  },
]

const faqs = [
  {
    q: 'Can other group members see how much I owe?',
    a: 'No. They may see that an expense exists and its description. Dollar amounts are encrypted and ACL-scoped to the payer and participants in the split.',
  },
  {
    q: 'Does Veil store my balances in a database?',
    a: 'Never. The backend stores metadata only: group names, handles, expense descriptions. All amounts live as ciphertext on-chain.',
  },
  {
    q: 'What network does Veil use?',
    a: 'Currently on Sepolia testnet with Zama FHEVM contracts. Connect MetaMask, sign in with SIWE, and grab test ETH from a faucet. Mainnet coming soon...',
  },
]

const heroStats = [
  { label: 'Encryption', value: 'FHEVM', accent: true },
  { label: 'Backend', value: 'No amounts' },
  { label: 'Auth', value: 'SIWE' },
]

function LaunchButton({ className = '' }: { className?: string }) {
  return (
    <Link to="/dashboard" className={`veil-btn-primary inline-flex min-h-11 items-center justify-center ${className}`}>
      Launch app
    </Link>
  )
}

function ScrollHint() {
  return (
    <div className="pointer-events-none absolute bottom-20 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-muted motion-reduce:hidden sm:bottom-8">
      <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Scroll</span>
      <span className="block h-9 w-px animate-pulse bg-gradient-to-b from-muted/80 to-transparent" />
    </div>
  )
}

export function Landing() {
  const scrollRef = useRef<HTMLElement>(null)

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-bg/80 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="min-w-0 shrink-0">
            <VeilLogo size="sm" />
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/dashboard"
              className="hidden text-sm text-muted transition hover:text-foreground md:inline"
            >
              Setup guide
            </Link>
            <LaunchButton className="!px-3.5 !py-2.5 text-sm sm:!px-4" />
          </div>
        </div>
      </header>

      <ScrollTimeline scrollRef={scrollRef} />
      <MobileScrollProgress scrollRef={scrollRef} />

      <main
        ref={scrollRef}
        className="h-[100dvh] overflow-y-auto scroll-smooth max-lg:snap-none lg:snap-y lg:snap-mandatory motion-reduce:snap-none"
      >
        {/* Hero */}
        <RevealSection id="landing-hero" panel className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,_rgba(124,92,252,0.18),_transparent_50%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_80%,_rgba(124,92,252,0.08),_transparent_40%)]" />

          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-4 sm:gap-10 sm:px-6 lg:grid-cols-2 lg:gap-16">
            <div className="min-w-0">
              <RevealItem delayMs={80}>
                <p className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-accent/25 bg-accent/5 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-accent sm:mb-4 sm:px-3 sm:text-[10px] sm:tracking-[0.18em]">
                  <span className="size-1.5 shrink-0 rounded-full bg-accent animate-pulse" />
                  <span className="truncate">Zama FHEVM Powered</span>
                </p>
              </RevealItem>
              <RevealItem delayMs={160}>
                <h1 className="text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                  Split bills with friends.
                  <span className="mt-1 block bg-gradient-to-r from-foreground via-foreground to-muted bg-clip-text text-transparent">
                    Keep every amount private.
                  </span>
                </h1>
              </RevealItem>
              <RevealItem delayMs={280}>
                <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted sm:mt-6 sm:text-base md:text-lg">
                  Veil is a group expense app built on Zama FHEVM. Balances and shares stay
                  encrypted on-chain. Your backend never sees a dollar figure. Connect your
                  wallet, pick a handle, start splitting.
                </p>
              </RevealItem>
              <RevealItem delayMs={400}>
                <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
                  <LaunchButton className="w-full sm:w-auto" />
                  <a
                    href="#how-it-works"
                    className="veil-btn-secondary min-h-11 w-full text-center sm:w-auto"
                  >
                    See how it works
                  </a>
                </div>
              </RevealItem>
              <RevealItem delayMs={520}>
                <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-3">
                  {heroStats.map((item) => (
                    <div
                      key={item.label}
                      className={`min-w-0 rounded-lg px-2.5 py-2.5 sm:rounded-xl sm:px-4 sm:py-3 ${
                        item.accent
                          ? 'border border-accent/30 bg-accent/10'
                          : 'border border-border/60 bg-surface/50'
                      }`}
                    >
                      <p className="truncate text-[9px] uppercase tracking-wide text-muted sm:text-[10px]">
                        {item.label}
                      </p>
                      <p
                        className={`mt-0.5 truncate font-mono text-xs font-medium sm:text-sm ${
                          item.accent ? 'text-accent' : ''
                        }`}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </RevealItem>
            </div>

            <RevealItem delayMs={240} className="min-w-0">
              <HeroVisual />
            </RevealItem>
          </div>
          <ScrollHint />
        </RevealSection>

        {/* Problem */}
        <RevealSection
          id="landing-problem"
          panel
          className="bg-[radial-gradient(ellipse_at_left,_rgba(220,38,38,0.04),_transparent_50%)]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <RevealItem>
              <LandingSectionHeader
                kicker="The problem"
                title="Regular split apps leak by design"
                description="Most expense trackers store plaintext balances in a database. Server access or a breach exposes who owes what. Veil flips the model: sensitive values stay encrypted on-chain."
              />
            </RevealItem>
            <RevealItem delayMs={200}>
              <div className="mt-6 sm:mt-10">
                <ProblemCompare />
              </div>
            </RevealItem>
          </div>
        </RevealSection>

        {/* How it works */}
        <RevealSection id="how-it-works" panel>
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <RevealItem>
              <LandingSectionHeader
                kicker="Flow"
                title="How it works"
                description="Chain transaction first, then metadata indexing. Three steps from group to repayment."
              />
            </RevealItem>
            <RevealItem delayMs={180}>
              <HowItWorksFlow steps={steps} />
            </RevealItem>
          </div>
        </RevealSection>

        {/* Privacy */}
        <RevealSection
          id="landing-privacy"
          panel
          className="bg-[radial-gradient(ellipse_at_right,_rgba(124,92,252,0.06),_transparent_55%)]"
        >
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <RevealItem>
              <LandingSectionHeader
                kicker="ACL"
                title="Who sees what"
                description="Visibility is enforced by FHE ACL on-chain, not UI toggles. Each role gets a different view."
              />
            </RevealItem>
            <RevealItem delayMs={200}>
              <PrivacyRoles rows={privacyRows} />
            </RevealItem>
          </div>
        </RevealSection>

        {/* Features */}
        <RevealSection id="landing-features" panel>
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <RevealItem>
              <LandingSectionHeader
                kicker="Product"
                title="Built for real groups"
                description="Privacy primitives you can demo, plus the flows judges actually want to click through."
              />
            </RevealItem>
            <RevealItem delayMs={160}>
              <FeatureShowcase features={features} />
            </RevealItem>
          </div>
        </RevealSection>

        {/* FAQ */}
        <RevealSection id="landing-faq" panel className="bg-surface/30">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <RevealItem>
              <LandingSectionHeader kicker="FAQ" title="Questions People ask" align="center" />
            </RevealItem>
            <RevealItem delayMs={140}>
              <FaqList faqs={faqs} />
            </RevealItem>
          </div>
        </RevealSection>

        {/* CTA */}
        <RevealSection id="landing-cta" panel className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(124,92,252,0.16),_transparent_65%)]" />
          <div className="relative mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
            <RevealItem>
              <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent shadow-[0_0_40px_rgba(124,92,252,0.2)] sm:mb-6 sm:size-16">
                <svg viewBox="0 0 24 24" fill="none" className="size-6 sm:size-7" aria-hidden>
                  <path
                    d="M6 10V8a6 6 0 1112 0v2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                </svg>
              </div>
              <h2 className="text-[1.625rem] font-semibold leading-tight tracking-tight sm:text-4xl">
                Ready to split privately?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
                Connect your wallet, sign in, pick your @handle. The app opens in a new tab
                so you can keep this page open while you demo.
              </p>
            </RevealItem>
            <RevealItem delayMs={200}>
              <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
                <LaunchButton className="w-full sm:w-auto" />
                <div className="w-full sm:w-auto [&_button]:min-h-11 [&_button]:w-full sm:[&_button]:w-auto">
                  <WalletButton />
                </div>
              </div>
              <p className="mt-5 text-xs text-muted sm:mt-6">
                Sepolia testnet ·{' '}
                <a
                  href="https://sepoliafaucet.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Get test ETH
                </a>
              </p>
            </RevealItem>
          </div>
        </RevealSection>

        <footer className="snap-start px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-sm text-muted lg:pb-8">
          <p>Veil · confidential group expenses on FHEVM</p>
          <p>Built by <Link to="https://www.x.com/0x_degengod" target="_blank" className="underline underline-offset-2 hover:text-foreground text-white">Degengod</Link></p>
        </footer>
      </main>
    </div>
  )
}
