import './app-breadcrumbs.css'

interface AppBreadcrumbsProps {
  readonly onNavigateCharacters:
    () => void
}

export function AppBreadcrumbs({
  onNavigateCharacters,
}: AppBreadcrumbsProps) {
  return (
    <nav
      className="app-breadcrumbs"
      aria-label="Migas de pan"
    >
      <ol>
        <li>
          <button
            type="button"
            onClick={onNavigateCharacters}
          >
            Personajes
          </button>
        </li>

        <li>
          <span aria-current="page">
            Crear personaje
          </span>
        </li>
      </ol>
    </nav>
  )
}
