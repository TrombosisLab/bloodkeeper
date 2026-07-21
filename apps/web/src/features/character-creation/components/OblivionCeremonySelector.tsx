import {
  oblivionCeremonyDefinitions,
} from '../data/oblivion-ceremony-definitions'

import {
  getLearnableInitialOblivionCeremonies,
} from '../domain/oblivion-ceremony-rules'

import type {
  CharacterDisciplinesDraft,
} from '../types/discipline.types'

import type {
  CharacterOblivionCeremoniesDraft,
  OblivionCeremonyKey,
} from '../types/oblivion-ceremony.types'

interface OblivionCeremonySelectorProps {
  disciplines:
    CharacterDisciplinesDraft

  value:
    CharacterOblivionCeremoniesDraft

  onChange: (
    value:
      CharacterOblivionCeremoniesDraft,
  ) => void
}

export function OblivionCeremonySelector({
  disciplines,
  value,
  onChange,
}: OblivionCeremonySelectorProps) {
  const oblivion =
    disciplines.find(
      (discipline) =>
        discipline.key ===
        'oblivion',
    )

  const oblivionLevel =
    oblivion?.value ?? 0

  const learnedPowerKeys =
    oblivion?.powerKeys ?? []

  const ceremonies =
    getLearnableInitialOblivionCeremonies(
      oblivionCeremonyDefinitions,
      oblivionLevel,
      learnedPowerKeys,
    )

  if (ceremonies.length === 0) {
    return null
  }

  const selectedKey =
    value.ceremonyKeys[0] ??
    null

  function selectCeremony(
    ceremonyKey:
      OblivionCeremonyKey,
  ) {
    onChange({
      ceremonyKeys: [
        ceremonyKey,
      ],
    })
  }

  return (
    <section className="oblivion-ceremony-selector">
      <div className="oblivion-ceremony-selector__heading">
        <div>
          <span>
            Olvido
          </span>

          <h3>
            Ceremonia inicial
          </h3>
        </div>

        <strong>
          1 requerida
        </strong>
      </div>

      <p className="oblivion-ceremony-selector__intro">
        Tus Poderes de Olvido permiten aprender
        las siguientes Ceremonias durante la
        creación inicial. Selecciona una.
      </p>

      <div className="oblivion-ceremony-grid">
        {ceremonies.map(
          (ceremony) => {
            const selected =
              ceremony.key ===
              selectedKey

            return (
              <button
                key={ceremony.key}
                type="button"
                className={
                  selected
                    ? 'oblivion-ceremony-card oblivion-ceremony-card--selected'
                    : 'oblivion-ceremony-card'
                }
                aria-pressed={
                  selected
                }
                onClick={() =>
                  selectCeremony(
                    ceremony.key,
                  )
                }
              >
                <span className="oblivion-ceremony-card__level">
                  Nivel {ceremony.level}
                </span>

                <strong>
                  {ceremony.name}
                </strong>

                {ceremony.summary && (
                  <p>
                    {ceremony.summary}
                  </p>
                )}

                {ceremony.sourcePage && (
                  <small>
                    Guía de Juego V5 · pág.{' '}
                    {ceremony.sourcePage}
                  </small>
                )}
              </button>
            )
          },
        )}
      </div>
    </section>
  )
}
