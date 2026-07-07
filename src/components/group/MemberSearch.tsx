import { useEffect, useRef, useState } from 'react'
import type { Member, TrustTier } from '../../types/contracts.ts'
import { formatHandle } from '../../lib/utils/format.ts'

type MemberSearchProps = {
  selected: Member[]
  /** Connected wallet — excluded from search results (e.g. group creator is auto-added). */
  excludeAddress?: string
  search: (query: string) => Promise<Member[]>
  onAdd: (member: Member) => void
  onRemove: (address: string) => void
  onInvite?: (handle: string) => void
}

const TIER_DOT: Record<TrustTier, string> = {
  low: 'bg-negative',
  medium: 'bg-warning',
  high: 'bg-positive',
}

export function MemberSearch({
  selected,
  excludeAddress,
  search,
  onAdd,
  onRemove,
  onInvite,
}: MemberSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Member[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [touched, setTouched] = useState(false)
  const reqId = useRef(0)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const id = ++reqId.current
    const handle = setTimeout(async () => {
      const found = await search(q)
      if (id !== reqId.current) return
      setResults(found)
      setIsSearching(false)
    }, 250)

    return () => clearTimeout(handle)
  }, [query, search])

  const selectedAddresses = new Set(selected.map((m) => m.address.toLowerCase()))
  const exclude = excludeAddress?.toLowerCase()
  const visibleResults = results.filter(
    (m) =>
      !selectedAddresses.has(m.address.toLowerCase()) &&
      (!exclude || m.address.toLowerCase() !== exclude),
  )
  const showNotFound =
    touched && !isSearching && query.trim().length > 0 && results.length === 0

  const add = (member: Member) => {
    if (exclude && member.address.toLowerCase() === exclude) return
    onAdd(member)
    setQuery('')
    setResults([])
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((member) => (
            <li
              key={member.address}
              className="flex items-center gap-2 rounded-full border border-border-subtle bg-surface-raised px-3 py-1.5 text-sm"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${TIER_DOT[member.trustTier]}`} />
              <span className="text-foreground">{formatHandle(member.handle)}</span>
              <button
                type="button"
                onClick={() => onRemove(member.address)}
                className="text-muted transition hover:text-foreground"
                aria-label={`Remove ${member.handle}`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-muted">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setTouched(true)
            }}
            placeholder="Search by @handle"
            className="w-full bg-transparent font-mono text-foreground outline-none placeholder:text-muted"
          />
          {isSearching && (
            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-border border-t-accent" />
          )}
        </div>

        {(visibleResults.length > 0 || showNotFound) && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg">
            {visibleResults.map((member) => (
              <button
                key={member.address}
                type="button"
                onClick={() => add(member)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-surface"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface font-mono text-xs text-muted">
                  {member.handle.charAt(0).toUpperCase()}
                </span>
                <span className="flex-1 text-sm text-foreground">
                  {formatHandle(member.handle)}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${TIER_DOT[member.trustTier]}`} />
              </button>
            ))}

            {showNotFound && (
              <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="text-sm text-muted">
                  No user found for {formatHandle(query)}
                </span>
                {onInvite && (
                  <button
                    type="button"
                    onClick={() => {
                      onInvite(query.trim())
                      setQuery('')
                    }}
                    className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs text-white transition hover:bg-accent-hover"
                  >
                    Invite by link
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
