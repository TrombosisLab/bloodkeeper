import { DotRating } from '../../../components/ui/DotRating'

import type {
  CharacterDisciplineView,
} from '../types/character-disciplines.types'

interface DisciplineCardProps {
  discipline: CharacterDisciplineView
}

export function DisciplineCard({
  discipline,
}: DisciplineCardProps) {
  return (
    <article className="discipline-card">
      <header className="discipline-card__header">
        <div>
          <span className="discipline-card__kicker">
            {discipline.catalogStatus === 'resolved'
              ? 'Disciplina'
              : 'Referencia no disponible'}
          </span>

          <h3>{discipline.name}</h3>
        </div>

        <DotRating
          label={discipline.name}
          value={discipline.value}
        />
      </header>

      <div className="discipline-card__powers">
        <span className="discipline-card__powers-label">
          Poderes adquiridos
        </span>

        {discipline.powers.length > 0 ? (
          <ul>
            {discipline.powers.map((power) => (
              <li key={power.key}>
                <details className="discipline-power-details">
                  <summary>
                    <span>{power.name}</span>

                    <small>
                      {power.level === null
                        ? 'Referencia no disponible'
                        : `Nivel ${power.level}`}
                    </small>
                  </summary>

                  <div className="discipline-power-details__content">
                    {power.summary ? (
                      <p>{power.summary}</p>
                    ) : (
                      <p>
                        Sin información adicional autorizada.
                      </p>
                    )}

                    {power.sourceName ? (
                      <small>
                        Fuente: {power.sourceName}
                        {power.sourcePage
                          ? ` · p. ${power.sourcePage}`
                          : ''}
                      </small>
                    ) : null}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="discipline-card__empty">
            Sin poderes adquiridos
          </p>
        )}
      </div>
    </article>
  )
}
