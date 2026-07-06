type StepperProps = {
  steps: string[]
  /** Zero-based index of the current (active) step */
  current: number
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex items-center">
      {steps.map((label, index) => {
        const isComplete = index < current
        const isActive = index === current
        const isLast = index === steps.length - 1

        return (
          <li
            key={label}
            className={`flex items-center ${isLast ? '' : 'flex-1'}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition ${
                  isComplete
                    ? 'border-accent bg-accent text-white'
                    : isActive
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-surface text-muted'
                }`}
              >
                {isComplete ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42l2.79 2.79 6.79-6.79a1 1 0 011.42 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={`hidden text-sm font-medium sm:block ${
                  isActive || isComplete ? 'text-foreground' : 'text-muted'
                }`}
              >
                {label}
              </span>
            </div>

            {!isLast && (
              <span
                className={`mx-3 h-px flex-1 transition ${
                  isComplete ? 'bg-accent' : 'bg-border'
                }`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
