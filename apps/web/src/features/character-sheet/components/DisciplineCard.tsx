import { displayValue } from './displayValue'
import { V5VisualMark } from '../../v5-visuals/V5VisualMark'
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
        <div className="discipline-card__title">
          <V5VisualMark kind="discipline" value={discipline.key} className="discipline-card__visual" decorative />
          <div>
          <span className="discipline-card__kicker">
            {discipline.catalogStatus === 'resolved'
              ? 'Disciplina'
              : 'Referencia no disponible'}
          </span>

          <h3>{displayValue(discipline.name, 'Disciplina')}</h3>
          </div>
        </div>

        <DotRating
          label={displayValue(discipline.name, 'Disciplina')}
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
                    <span>{displayValue(power.name, 'Poder')}</span>

                    <small>
                      {power.level === null
                        ? 'Referencia no disponible'
                        : `Nivel ${power.level}`}
                    </small>
                  </summary>

                  <div className="discipline-power-details__content">
                    {power.mechanics?.systemSummary ? (
                      <p>{displayValue(power.mechanics.systemSummary, '')}</p>
                    ) : power.summary ? (
                      <p>{displayValue(power.summary, '')}</p>
                    ) : (
                      <p>
                        Sin información adicional autorizada.
                      </p>
                    )}

                    {power.mechanics ? (
                      <section
                        className="discipline-power-mechanics"
                        aria-label={`Mecánicas de ${displayValue(power.name, 'Poder')}`}
                      >
                        <dl className="discipline-power-mechanics__facts">
                          <div>
                            <dt>Coste</dt>
                            <dd>{displayValue(power.mechanics.cost, '')}</dd>
                          </div>

                          <div>
                            <dt>Duración</dt>
                            <dd>{displayValue(power.mechanics.duration, '')}</dd>
                          </div>
                        </dl>

                        {power.mechanics.checks.length > 0 ? (
                          <div className="discipline-power-mechanics__group">
                            <strong>Pruebas</strong>

                            <ul>
                              {power.mechanics.checks.map(
                                (check) => (
                                  <li
                                    key={`${displayValue(check.label, 'Comprobacion')}-${displayValue(check.detail, '')}`}
                                  >
                                    <span>{displayValue(check.label, 'Comprobacion')}</span>
                                    <small>{displayValue(check.detail, '')}</small>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}

                        {power.mechanics.modifiers.length > 0 ? (
                          <div className="discipline-power-mechanics__group">
                            <strong>Modificadores</strong>

                            <ul>
                              {power.mechanics.modifiers.map(
                                (modifier) => (
                                  <li key={displayValue(modifier, '')}>
                                    {displayValue(modifier, '')}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}

                        {power.mechanics.limits.length > 0 ? (
                          <div className="discipline-power-mechanics__group">
                            <strong>Límites</strong>

                            <ul>
                              {power.mechanics.limits.map(
                                (limit) => (
                                  <li key={displayValue(limit, '')}>
                                    {displayValue(limit, '')}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        ) : null}
                      </section>
                    ) : null}

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
