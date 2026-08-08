import {
  getCharacterAdvantageDefinition,
} from '../data/character-advantage-definitions'

import {
  getPredatorType,
  resolvePredatorTypePointDistributionDefinitions,
  resolvePredatorTypePointDistributions,
  validatePredatorTypePointDistributionAllocation,
} from '../domain/predator-type-rules'

import {
  getPredatorTypePointDistributionAllocations,
  getPredatorTypePointDistributionAllowedRatings,
  updatePredatorTypePointDistributionSelection,
} from '../domain/predator-type-point-distribution-draft-rules'

import {
  AdvantageInstanceDetailsEditor,
} from './advantages/AdvantageInstanceDetailsEditor'

import {
  PredatorTypeAdvantageSummary,
} from './PredatorTypeAdvantageSummary'

import {
  PredatorTypeChoiceSelector,
} from './PredatorTypeChoiceSelector'

import {
  AdvantageRatingControl,
} from './advantages/AdvantageRatingControl'

import type {
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types'

import type {
  ClanKey,
} from '../types/clan.types'

interface PredatorTypeConfigurationProps {
  predatorTypeKey: string
  clanKey: ClanKey | null
  choiceSelections: Record<string, number>
  advantages: CharacterAdvantagesDraft

  onChoiceSelectionsChange: (
    value: Record<string, number>,
  ) => void

  onAdvantagesChange: (
    value: CharacterAdvantagesDraft,
  ) => void
}

export function PredatorTypeConfiguration({
  predatorTypeKey,
  clanKey,
  choiceSelections,
  advantages,
  onChoiceSelectionsChange,
  onAdvantagesChange,
}: PredatorTypeConfigurationProps) {
  const definition =
    getPredatorType(
      predatorTypeKey,
    )

  if (definition === undefined) {
    return null
  }

  const distributions =
    resolvePredatorTypePointDistributions(
      predatorTypeKey,
      { clan: clanKey },
      choiceSelections,
    )

  const configurableSelections =
    advantages.selections.filter(
      selection => {
        if (
          selection.origin !==
          'predatorType'
        ) {
          return false
        }

        return (
          getCharacterAdvantageDefinition(
            selection.definitionKey,
          )?.requiresInstanceDetails ===
          true
        )
      },
    )

  function updateConfiguredSelection(
    selection:
      CharacterAdvantagesDraft[
        'selections'
      ][number],
  ) {
    onAdvantagesChange({
      selections:
        advantages.selections.map(
          current =>
            current.selectionId ===
            selection.selectionId
              ? selection
              : current,
        ),
    })
  }

  return (
    <section className="creation-field creation-field--wide">
      <div className="creation-step-heading">
        <span>
          Tipo de Depredador
        </span>

        <h3>
          Configuración del Tipo de Depredador
        </h3>

        <p>
          Resuelve aquí las decisiones y repartos
          que concede {definition.name}. Las fases
          posteriores consumirán este resultado.
        </p>
      </div>

      <PredatorTypeChoiceSelector
        predatorTypeKey={
          predatorTypeKey
        }
        clanKey={clanKey}
        value={choiceSelections}
        onChange={
          onChoiceSelectionsChange
        }
      />

      {distributions.map(
        (
          distribution,
          distributionIndex,
        ) => {
          const definitions =
            resolvePredatorTypePointDistributionDefinitions(
              distribution,
            )

          const allocations =
            getPredatorTypePointDistributionAllocations(
              predatorTypeKey,
              distributionIndex,
              advantages,
            )

          const spent =
            allocations.reduce(
              (
                total,
                allocation,
              ) =>
                total +
                allocation.rating,
              0,
            )

          const validation =
            validatePredatorTypePointDistributionAllocation(
              distribution,
              allocations,
            )

          return (
            <section
              key={
                `${predatorTypeKey}-${distributionIndex}`
              }
              className="creation-field creation-field--wide"
            >
              <span>
                Reparto {
                  distributionIndex + 1
                }
              </span>

              <strong>
                {spent}
                {' / '}
                {distribution.points}
                {' puntos'}
              </strong>

              <div className="creation-form-grid">
                {definitions.map(
                  advantageDefinition => {
                    const current =
                      allocations.find(
                        allocation =>
                          allocation.definitionKey ===
                          advantageDefinition.key,
                      )

                    const allowedRatings =
                      getPredatorTypePointDistributionAllowedRatings(
                        distribution,
                        advantageDefinition.key,
                      )

                    return (
                      <label
                        key={
                          advantageDefinition.key
                        }
                        className="creation-field"
                      >
                        <span>
                          {
                            advantageDefinition.name
                          }
                        </span>

                        <AdvantageRatingControl
                          value={
                            current?.rating ??
                            0
                          }
                          min={0}
                          max={
                            distribution.points
                          }
                          allowedRatings={[
                            0,
                            ...allowedRatings,
                          ]}
                          onChange={
                            rating =>
                              onAdvantagesChange(
                                updatePredatorTypePointDistributionSelection(
                                  predatorTypeKey,
                                  distributionIndex,
                                  advantageDefinition.key,
                                  rating,
                                  choiceSelections,
                                  advantages,
                                ),
                              )
                          }
                        />
                      </label>
                    )
                  },
                )}
              </div>

              {!validation.valid ? (
                <ul className="creation-step-errors">
                  {validation.errors.map(
                    error => (
                      <li key={error}>
                        {error}
                      </li>
                    ),
                  )}
                </ul>
              ) : null}
            </section>
          )
        },
      )}

      <PredatorTypeAdvantageSummary
        predatorTypeKey={
          predatorTypeKey
        }
        clanKey={clanKey}
        choiceSelections={
          choiceSelections
        }
      />

      {configurableSelections.length >
      0 ? (
        <section className="creation-field creation-field--wide">
          <span>
            Datos asociados
          </span>

          {configurableSelections.map(
            selection => (
              <div
                key={
                  selection.selectionId
                }
                className="advantage-instance-block"
              >
                <AdvantageInstanceDetailsEditor
                  selection={
                    selection
                  }
                  onChange={
                    updateConfiguredSelection
                  }
                />
              </div>
            ),
          )}
        </section>
      ) : null}
    </section>
  )
}
