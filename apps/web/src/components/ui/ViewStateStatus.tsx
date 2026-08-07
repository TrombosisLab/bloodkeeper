import type { ReactNode } from 'react'

export type ViewStateStatusKind =
  | 'loading'
  | 'empty'

interface ViewStateStatusProps {
  readonly state: ViewStateStatusKind
  readonly className?: string
  readonly children: ReactNode
}

export function ViewStateStatus({
  state,
  className,
  children,
}: ViewStateStatusProps) {
  return (
    <p
      className={className}
      data-view-state={state}
      role="status"
      aria-live="polite"
    >
      {children}
    </p>
  )
}
