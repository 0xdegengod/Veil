type LoadMoreFooterProps = {
  showing: number
  total: number
  hasMore: boolean
  onLoadMore: () => void
  isLoading?: boolean
}

export function LoadMoreFooter({
  showing,
  total,
  hasMore,
  onLoadMore,
  isLoading = false,
}: LoadMoreFooterProps) {
  if (total === 0) return null

  return (
    <div className="mt-4 flex flex-col items-center gap-2 border-t border-border-subtle pt-4">
      <p className="text-xs text-muted">
        Showing {showing} of {total}
      </p>
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          className="veil-btn-secondary text-sm"
        >
          {isLoading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
