type LandingSectionHeaderProps = {
  kicker: string
  title: string
  description?: string
  align?: 'left' | 'center'
}

export function LandingSectionHeader({
  kicker,
  title,
  description,
  align = 'left',
}: LandingSectionHeaderProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : ''

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">{kicker}</p>
      <h2 className="mt-3 text-[1.625rem] font-semibold leading-[1.15] tracking-tight sm:text-3xl lg:text-[2.75rem] lg:leading-[1.12]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{description}</p>
      )}
    </div>
  )
}
