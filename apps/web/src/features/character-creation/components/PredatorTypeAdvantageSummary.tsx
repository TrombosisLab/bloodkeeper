import {
  characterAdvantageDefinitions,
} from '../data/character-advantage-definitions'

import {
  getPredatorType,
  predatorPendingReferences,
  resolveSelectedPredatorChoices,
} from '../domain/predator-type-rules'

import type {
  ClanKey,
} from '../types/clan.types'

import type {
  PredatorTypeChoiceGrant,
} from '../types/predator-type.types'

interface PredatorTypeAdvantageSummaryProps {
  predatorTypeKey: string
  clanKey: ClanKey | null
  choiceSelections: Record<string, number>
}

interface VisibleGrant {
  definitionKey: string
  category:
    | 'background'
    | 'merit'
    | 'flaw'
  rating: number
  source:
    | 'automatic'
    | 'choice'
}

const categoryLabels = {
  background: 'Trasfondo',
  merit: 'Mérito',
  flaw: 'Defecto',
} as const

export function PredatorTypeAdvantageSummary({
  predatorTypeKey,
  clanKey,
  choiceSelections,
}: PredatorTypeAdvantageSummaryProps) {
  if (
    predatorTypeKey === '' ||
    clanKey === null
  ) {
    return null
  }

  const definition =
    getPredatorType(
      predatorTypeKey,
    )

  if (!definition) {
    return null
  }

  const pendingReferences =
    new Set(
      predatorPendingReferences(
        predatorTypeKey,
      ),
    )

  const fixedGrants:
    VisibleGrant[] =
      (
        definition.fixedGrants
          ?.advantages ?? []
      )
        .filter(
          (grant) =>
            !pendingReferences.has(
              grant.definitionKey,
            ),
        )
        .map(
          (grant) => ({
            ...grant,
            source: 'automatic',
          }),
        )

  const choiceGrants:
    VisibleGrant[] =
      resolveSelectedPredatorChoices(
        predatorTypeKey,
        {
          clan: clanKey,
        },
        choiceSelections,
      )
        .filter(
          (
            grant,
          ): grant is Extract<
            PredatorTypeChoiceGrant,
            {
              type: 'advantage'
            }
          > =>
            grant.type ===
            'advantage',
        )
        .filter(
          (grant) =>
            !pendingReferences.has(
              grant.definitionKey,
            ),
        )
        .map(
          (grant) => ({
            definitionKey:
              grant.definitionKey,
            category:
              grant.category,
            rating:
              grant.rating,
            source: 'choice',
          }),
        )

  const grants = [
    ...fixedGrants,
    ...choiceGrants,
  ]

  if (grants.length === 0) {
    return null
  }

  return (
    <section className="creation-field creation-field--wide">
      <span>
        Ventajas y Defectos del Tipo de Depredador
      </span>

      <ul>
        {grants.map(
          (
            grant,
            index,
          ) => {
            const advantage =
              characterAdvantageDefinitions.find(
                (candidate) =>
                  candidate.key ===
                  grant.definitionKey,
              )

            return (
              <li
                key={[
                  grant.source,
                  grant.definitionKey,
                  index,
                ].join(':')}
              >
                <strong>
                  {
                    advantage?.name ??
                    grant.definitionKey
                  }
                </strong>

                {' · '}

                {
                  categoryLabels[
                    grant.category
                  ]
                }

                {' · '}

                {'•'.repeat(
                  grant.rating,
                )}

                {' · '}

                {grant.source ===
                'automatic'
                  ? 'Automático'
                  : 'Elección aplicada'}
              </li>
            )
          },
        )}
      </ul>

      <small>
        Estas concesiones se aplican con origen
        Tipo de Depredador y no consumen el
        presupuesto ordinario 7/2.
      </small>
    </section>
  )
}
