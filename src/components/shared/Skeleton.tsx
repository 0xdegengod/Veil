type SkeletonProps = {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface-raised rounded-lg h-16 w-full ${className}`}
    />
  )
}
