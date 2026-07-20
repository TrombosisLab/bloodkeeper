import { DotRating } from '../../../components/ui/DotRating'

import type {
  CharacterDiscipline,
} from '../types/character-disciplines.types'

interface DisciplineCardProps {
  discipline: CharacterDiscipline
}

export function DisciplineCard({
  discipline,
}: DisciplineCardProps) {
  return (
    <article className="discipline-card">
      <header className="discipline-card__header">
        <div>
          <span className="discipline-card__kicker">
            Disciplina
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
                <span>{power.name}</span>

                <small>
                  Nivel {power.level}
                </small>
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
