import type {
  DisciplineKey,
} from '../types/discipline.types'

interface DisciplineEditorCardProps {
  disciplineKey: DisciplineKey
  name: string
  value: number
  effectiveValue?: number

  onChange: (
    key: DisciplineKey,
    value: number,
  ) => void
}

export function DisciplineEditorCard({
  disciplineKey,
  name,
  value,
  effectiveValue,
  onChange,
}: DisciplineEditorCardProps) {
  const displayedValue =
    effectiveValue ?? value

  const predatorBonus =
    Math.max(
      0,
      displayedValue - value,
    )

  const visibleDots =
    Math.max(
      2,
      displayedValue,
    )

  return (
    <article
      className={
        displayedValue > 0
          ? 'discipline-editor-card discipline-editor-card--selected'
          : 'discipline-editor-card'
      }
    >
      <header className="discipline-editor-card__heading">
        <div>
          <span>
            Disciplina de clan
          </span>

          <h3>{name}</h3>
        </div>

        <strong>
          {displayedValue}
        </strong>
      </header>

      <div className="discipline-editor-card__control">
        <button
          type="button"
          aria-label={`Reducir ${name}`}
          disabled={value <= 0}
          onClick={() =>
            onChange(
              disciplineKey,
              value - 1,
            )
          }
        >
          −
        </button>

        <div
          className="discipline-editor-card__dots"
          aria-label={`${name}: ${displayedValue} de ${visibleDots}`}
        >
          {Array.from(
            { length: visibleDots },
            (_, index) => (
              <span
                key={index}
                className={
                  index < displayedValue
                    ? 'discipline-editor-dot discipline-editor-dot--filled'
                    : 'discipline-editor-dot'
                }
                aria-hidden="true"
              />
            ),
          )}
        </div>

        <button
          type="button"
          aria-label={`Aumentar ${name}`}
          disabled={value >= 2}
          onClick={() =>
            onChange(
              disciplineKey,
              value + 1,
            )
          }
        >
          +
        </button>
      </div>

      <p className="discipline-editor-card__hint">
        {predatorBonus > 0
          ? `${value} de creación + ${predatorBonus} por Tipo de Depredador`
          : value === 0
            ? 'Sin puntos asignados'
            : value === 1
              ? 'Un punto asignado'
              : 'Dos puntos asignados'}
      </p>
    </article>
  )
}
