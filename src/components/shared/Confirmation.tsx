type ConfirmationAction = {
  label: string
  onClick: () => void
}

type ConfirmationLine = {
  text: string
  sensitive?: boolean
}

type ConfirmationProps = {
  icon?: string
  title: string
  lines: (string | ConfirmationLine)[]
  primaryAction: ConfirmationAction
  secondaryAction?: ConfirmationAction
  /** When true, lines marked sensitive render only if authorized is true */
  sensitive?: boolean
  authorized?: boolean
}

function normalizeLine(line: string | ConfirmationLine): ConfirmationLine {
  return typeof line === 'string' ? { text: line } : line
}

export function Confirmation({
  icon = '✓',
  title,
  lines,
  primaryAction,
  secondaryAction,
  sensitive = false,
  authorized = true,
}: ConfirmationProps) {
  const visibleLines = lines
    .map(normalizeLine)
    .filter((line) => {
      if (line.sensitive || sensitive) {
        return authorized
      }
      return true
    })

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-surface p-6 text-center">
      <span className="text-2xl">{icon}</span>
      <h2 className="text-lg font-medium text-foreground">{title}</h2>
      {visibleLines.map((line) => (
        <p key={line.text} className="text-sm text-muted">
          {line.text}
        </p>
      ))}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="w-full rounded-lg bg-accent px-4 py-3 text-sm hover:bg-accent-hover sm:w-auto"
        >
          {primaryAction.label}
        </button>
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm text-muted sm:w-auto"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  )
}
