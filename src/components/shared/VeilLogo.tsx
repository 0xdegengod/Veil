type VeilLogoProps = {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
}

const sizes = {
  sm: { img: 'h-8 w-8', text: 'text-base' },
  md: { img: 'h-10 w-10', text: 'text-lg' },
  lg: { img: 'h-14 w-14', text: 'text-2xl' },
}

export const VEIL_LOGO_SRC = '/favicon.png'

export function VeilLogo({ size = 'md', showWordmark = true, className = '' }: VeilLogoProps) {
  const s = sizes[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={VEIL_LOGO_SRC}
        alt=""
        className={`${s.img} shrink-0 rounded-xl object-contain`}
        aria-hidden={showWordmark}
      />
      {showWordmark && (
        <span className={`${s.text} font-semibold tracking-tight text-foreground`}>Veil</span>
      )}
    </div>
  )
}
