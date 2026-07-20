import type {
  DisciplineKey,
} from '../types/discipline.types'

interface DisciplineEditorCardProps {
  disciplineKey: DisciplineKey
  name: string
  value: number

  onChange: (
    key: DisciplineKey,
    value: number,
  ) => void
}

export function DisciplineEditorCard({
  disciplineKey,
  name,
  value,
  onChange,
}: DisciplineEditorCardProps) {
  return (
    <article
      className={
        value > 0
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
          {value}
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
          aria-label={`${name}: ${value} de 2`}
        >
          {Array.from(
            { length: 2 },
            (_, index) => (
              <span
                key={index}
                className={
                  index < value
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
        {value === 0
          ? 'Sin puntos asignados'
          : value === 1
            ? 'Un punto asignado'
            : 'Dos puntos asignados'}
      </p>
    </article>
  )
}
