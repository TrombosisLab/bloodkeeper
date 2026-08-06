import type {
  ReactNode,
} from 'react'

interface AppLayoutProps {
  readonly breadcrumbs?: ReactNode
  readonly children: ReactNode
  readonly contentClassName?: string
  readonly header: ReactNode
  readonly navigation: ReactNode
}

export function AppLayout({
  breadcrumbs,
  children,
  contentClassName,
  header,
  navigation,
}: AppLayoutProps) {
  return (
    <div className="application">
      {header}

      <div className="application-shell">
        {navigation}

        <div className="application-shell__content">
          {breadcrumbs}

          <main className={contentClassName}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
