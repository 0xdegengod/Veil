type VeilLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
}

const sizes = {
  sm: { box: 'h-8 w-8', text: 'text-base' },
  md: { box: 'h-10 w-10', text: 'text-lg' },
  lg: { box: 'h-14 w-14', text: 'text-2xl' },
}

export function VeilLogo({ size = 'md', showWordmark = true }: VeilLogoProps) {
  const s = sizes[size]

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${s.box} flex items-center justify-center rounded-xl border border-border bg-surface-raised`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-1/2 w-1/2 text-foreground"
          aria-hidden
        >
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
      {showWordmark && (
        <span className={`${s.text} font-semibold tracking-tight text-foreground`}>Veil</span>
      )}
    </div>
  )
}
