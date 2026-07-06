const ciphertext = ['0x7f3a', 'enc()', '⊕', 'fhe', '0x9c2', 'acl', '•••', '0x4b1']

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
      <div className="pointer-events-none absolute -inset-6 rounded-full bg-accent/10 blur-3xl sm:-inset-8" />

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface/80 p-4 shadow-[0_16px_48px_rgba(124,92,252,0.1)] backdrop-blur-sm sm:rounded-3xl sm:p-6 sm:shadow-[0_24px_80px_rgba(124,92,252,0.12)] lg:p-8">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 sm:pb-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="size-1.5 rounded-full bg-accent sm:size-2" />
            <span className="size-1.5 rounded-full bg-foreground/20 sm:size-2" />
            <span className="size-1.5 rounded-full bg-foreground/20 sm:size-2" />
          </div>
          <span className="truncate font-mono text-[9px] text-muted sm:text-[10px]">
            confidential_ledger.sol
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1.5 sm:mt-6 sm:grid-cols-4 sm:gap-2">
          {ciphertext.map((token) => (
            <div
              key={token}
              className="rounded-md border border-border/50 bg-surface-raised/80 px-1 py-2 text-center font-mono text-[9px] text-muted sm:rounded-lg sm:px-2 sm:py-3 sm:text-[10px]"
            >
              {token}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4 sm:mt-6 sm:rounded-2xl sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent sm:size-11 sm:rounded-xl">
              <svg viewBox="0 0 24 24" fill="none" className="size-4 sm:size-5" aria-hidden>
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
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-accent sm:text-xs">
                Your share
              </p>
              <p className="mt-1.5 font-mono text-base font-medium tracking-tight blur-[5px] select-none sm:mt-2 sm:text-lg">
                $47.50
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted sm:text-xs">
                Only you and the payer can decrypt this
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-surface-raised/60 px-3 py-2.5 sm:mt-4 sm:rounded-xl sm:px-4 sm:py-3">
          <span className="truncate text-[11px] text-muted sm:text-xs">Dinner at Lisbon</span>
          <span className="shrink-0 font-mono text-[10px] text-foreground/40 sm:text-xs">
            ████████
          </span>
        </div>
      </div>
    </div>
  )
}

export function ProblemCompare() {
  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
      <div className="relative overflow-hidden rounded-xl border border-negative/25 bg-negative/5 p-4 pt-10 sm:rounded-2xl sm:p-5 sm:pt-11 md:p-6">
        <div className="absolute right-3 top-3 rounded-full bg-negative/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-negative">
          Typical app
        </div>
        <p className="text-sm font-medium">Weekend trip</p>
        <div className="mt-3 space-y-2 sm:mt-4">
          {[
            { name: 'Alex', amount: '$84.00' },
            { name: 'Sam', amount: '$42.50' },
            { name: 'You', amount: '$127.00' },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-2 rounded-lg bg-surface/80 px-3 py-2.5 text-sm"
            >
              <span className="min-w-0 truncate">{row.name}</span>
              <span className="shrink-0 font-mono text-negative">{row.amount}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted sm:mt-4">
          Plaintext in a database. Visible to admins, breaches, and curious roommates.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-accent/30 bg-accent/5 p-4 pt-10 sm:rounded-2xl sm:p-5 sm:pt-11 md:p-6">
        <div className="absolute right-3 top-3 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-accent">
          Veil
        </div>
        <p className="text-sm font-medium">Weekend trip</p>
        <div className="mt-3 space-y-2 sm:mt-4">
          {[
            { name: 'Alex', visible: false },
            { name: 'Sam', visible: true },
            { name: 'You', visible: true },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-2 rounded-lg bg-surface/80 px-3 py-2.5 text-sm"
            >
              <span className="min-w-0 truncate">{row.name}</span>
              {row.visible ? (
                <span className="shrink-0 font-mono text-accent blur-[4px] select-none">
                  $42.50
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-muted sm:text-xs">
                  <LockIcon className="size-3" />
                  encrypted
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted sm:mt-4">
          FHE on-chain. Each wallet only decrypts what ACL allows.
        </p>
      </div>
    </div>
  )
}

type Step = { n: string; title: string; body: string }

export function HowItWorksFlow({ steps }: { steps: Step[] }) {
  return (
    <div className="relative mt-8 sm:mt-12">
      <div
        className="absolute bottom-4 left-7 top-4 w-px bg-gradient-to-b from-accent/50 via-accent/25 to-transparent md:hidden"
        aria-hidden
      />

      <div
        className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent lg:block"
        aria-hidden
      />

      <ol className="grid gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        {steps.map((step, i) => (
          <li key={step.n} className="relative">
            <div className="flex items-start gap-4 lg:flex-col lg:items-start lg:gap-4">
              <div className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 font-mono text-sm font-medium text-accent shadow-[0_0_20px_rgba(124,92,252,0.12)] sm:size-16 sm:rounded-2xl">
                {step.n}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-base font-medium sm:text-lg">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted sm:mt-2">{step.body}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className="absolute -right-4 top-7 hidden text-accent/40 lg:block"
                aria-hidden
              >
                →
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

type PrivacyRow = { role: string; sees: string; hidden: string }

export function PrivacyRoles({ rows }: { rows: PrivacyRow[] }) {
  const icons = [EyeOffIcon, EyeIcon, EyeIcon]

  return (
    <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-4 md:grid-cols-3">
      {rows.map((row, i) => {
        const Icon = icons[i] ?? EyeOffIcon
        return (
          <div
            key={row.role}
            className="rounded-xl border border-border/60 bg-surface p-4 sm:rounded-2xl sm:p-5"
          >
            <div className="flex items-start gap-3 sm:block">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent sm:mb-0 sm:size-10 sm:rounded-xl">
                <Icon className="size-4 sm:size-5" />
              </div>
              <div className="min-w-0 flex-1 sm:mt-4">
                <p className="text-sm font-medium leading-snug">{row.role}</p>
                <div className="mt-3 space-y-3 border-t border-border/60 pt-3 sm:mt-4 sm:pt-4">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-positive">
                      Can see
                    </p>
                    <p className="mt-1 text-sm leading-snug text-muted">{row.sees}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                      Hidden
                    </p>
                    <p className="mt-1 text-sm leading-snug text-foreground/70">{row.hidden}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

type Feature = { title: string; description: string }

export function FeatureShowcase({ features }: { features: Feature[] }) {
  const [hero, ...rest] = features

  return (
    <div className="mt-8 space-y-3 sm:mt-10 sm:space-y-4">
      {hero && (
        <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-br from-accent/10 via-surface to-surface p-5 sm:rounded-2xl sm:p-6 md:p-8">
          <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative max-w-xl">
            <p className="text-xs font-medium uppercase tracking-wide text-accent">Core</p>
            <h3 className="mt-2 text-lg font-semibold sm:text-xl md:text-2xl">{hero.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:mt-3 sm:text-base">
              {hero.description}
            </p>
          </div>
          <div className="relative mt-4 flex flex-wrap gap-2 sm:mt-6">
            {['FHEVM', 'ACL', 'Ciphertext'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 font-mono text-[10px] text-accent sm:px-3"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {rest.map((f) => (
          <li
            key={f.title}
            className="rounded-xl border border-border/60 bg-surface/60 p-4 backdrop-blur-sm sm:rounded-2xl sm:p-5"
          >
            <div className="mb-2.5 h-1 w-8 rounded-full bg-accent/60 sm:mb-3" />
            <h3 className="text-sm font-medium sm:text-base">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted sm:mt-2">{f.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

type Faq = { q: string; a: string }

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <dl className="mt-8 divide-y divide-border/60 sm:mt-10">
      {faqs.map((faq) => (
        <div key={faq.q} className="py-5 first:pt-0 last:pb-0 sm:py-6">
          <dt className="text-[15px] font-medium leading-snug sm:text-base">{faq.q}</dt>
          <dd className="mt-2 text-sm leading-relaxed text-muted">{faq.a}</dd>
        </div>
      ))}
    </dl>
  )
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M6 10V8a6 6 0 1112 0v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function EyeIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  )
}

function EyeOffIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M10.7 10.7a3 3 0 004.6 4.6M6.3 6.3C4.4 7.6 2.9 9.4 2 12c0 0 3.5 7 10 7 1.8 0 3.4-.5 4.8-1.2M4 4l16 16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  )
}
