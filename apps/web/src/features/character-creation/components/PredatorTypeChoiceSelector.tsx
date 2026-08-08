import {
  disciplineDefinitions,
} from '../data/discipline-definitions'

import {
  skillDefinitions,
} from '../data/skill-definitions'

import {
  getCharacterAdvantageDefinition,
} from '../data/character-advantage-definitions'

import {
  getAvailablePredatorTypeChoiceOptions,
  getPredatorType,
  getPredatorTypeChoiceLabel,
} from '../domain/predator-type-rules'

import type {
  PredatorTypeChoiceGrant,
} from '../types/predator-type.types'

import type {
  ClanKey,
} from '../types/clan.types'

interface PredatorTypeChoiceSelectorProps {
  predatorTypeKey: string
  clanKey: ClanKey | null
  value: Record<string, number>

  onChange: (
    value: Record<string, number>,
  ) => void
}

function getGrantLabel(
  grant: PredatorTypeChoiceGrant,
): string {
  switch (grant.type) {
    case 'discipline': {
      const definition =
        disciplineDefinitions.find(
          candidate =>
            candidate.key ===
              grant.disciplineKey,
        )

      return [
        definition?.name ??
          grant.disciplineKey,
        `+${grant.dots} punto`,
        '+1 Poder',
      ].join(' · ')
    }

    case 'specialty': {
      const skill =
        skillDefinitions.find(
          definition =>
            definition.key ===
            grant.skillKey,
        )

      return `${
        skill?.label ??
        grant.skillKey
      } (${grant.name})`
    }

    case 'advantage': {
      const definition =
        getCharacterAdvantageDefinition(
          grant.definitionKey,
        )

      return [
        definition?.name ??
          grant.definitionKey,
        `${grant.rating} punto${grant.rating === 1 ? '' : 's'}`,
      ].join(' · ')
    }

    case 'humanity':
      return `Humanidad ${grant.modifier >= 0 ? '+' : ''}${grant.modifier}`

    case 'bloodPotency':
      return `Potencia de Sangre ${grant.modifier >= 0 ? '+' : ''}${grant.modifier}`

    case 'pointDistribution':
      return `Reparte ${grant.points} puntos`

    default:
      return 'Opción del Tipo de Depredador'
  }
}

export function PredatorTypeChoiceSelector({
  predatorTypeKey,
  clanKey,
  value,
  onChange,
}: PredatorTypeChoiceSelectorProps) {
  const definition =
    getPredatorType(predatorTypeKey)

  if (!definition) {
    return null
  }

  const choices =
    (definition.choices ?? [])
      .map(
        choice => ({
          choice,
          availableOptions:
            getAvailablePredatorTypeChoiceOptions(
              choice,
              {
                clan: clanKey,
              },
            ),
        }),
      )
      .filter(
        entry =>
          entry.availableOptions.length > 0,
      )

  if (choices.length === 0) {
    return null
  }

  return (
    <section className="creation-field creation-field--wide">
      <span>
        Elecciones del Tipo de Depredador
      </span>

      <div className="creation-form-grid">
        {choices.map(
          ({
            choice,
            availableOptions,
          }) => {
            const label =
              getPredatorTypeChoiceLabel(
                choice,
              )

            if (
              availableOptions.length === 1
            ) {
              return (
                <div
                  key={choice.id}
                  className="creation-field creation-field--wide"
                >
                  <span>{label}</span>

                  <strong>
                    {getGrantLabel(
                      availableOptions[0]
                        .option.grant,
                    )}
                  </strong>

                  <small>
                    Aplicada automáticamente por
                    las restricciones vigentes.
                  </small>
                </div>
              )
            }

            const selectedIndex =
              value[choice.id]

            return (
              <label
                key={choice.id}
                className="creation-field creation-field--wide"
              >
                <span>{label}</span>

                <select
                  value={
                    selectedIndex ===
                    undefined
                      ? ''
                      : String(
                          selectedIndex,
                        )
                  }
                  onChange={
                    event => {
                      const next = {
                        ...value,
                      }

                      if (
                        event.target.value ===
                        ''
                      ) {
                        delete next[
                          choice.id
                        ]
                      } else {
                        next[choice.id] =
                          Number(
                            event.target
                              .value,
                          )
                      }

                      onChange(next)
                    }
                  }
                >
                  <option value="">
                    Selecciona una opción
                  </option>

                  {availableOptions.map(
                    ({
                      index,
                      option,
                    }) => (
                      <option
                        key={index}
                        value={index}
                      >
                        {getGrantLabel(
                          option.grant,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </label>
            )
          },
        )}
      </div>
    </section>
  )
}
