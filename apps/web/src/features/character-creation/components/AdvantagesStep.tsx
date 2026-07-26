import {
  characterAdvantageDefinitions,
} from '../data/character-advantage-definitions'

import {
  getCharacterAdvantagesBudget,
} from '../domain/advantage-rules'

import {
  createInitialAdvantageInstanceDetails,
} from '../domain/advantage-instance-details-rules'

import {
  getThinBloodTraitDefinitionsByCategory,
} from '../data/thin-blood-trait-definitions'

import {
  useThinBloodTraits,
} from '../hooks/useThinBloodTraits'

import {
  ThinBloodSection,
} from './thin-blood/ThinBloodSection'

import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

import type {
  CharacterAdvantageCategory,
  CharacterAdvantageSelectionDraft,
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types'

import type { ClanKey } from '../types/clan.types'
import type { CharacterThinBloodTraitsDraft } from '../types/thin-blood-trait.types'

import type {
  CharacterThinBloodAlchemyDraft,
} from '../types/thin-blood-alchemy.types'

interface AdvantagesStepProps {
  clanKey: ClanKey | null

  value: CharacterAdvantagesDraft

  onChange: (
    value: CharacterAdvantagesDraft,
  ) => void

  thinBloodTraits: CharacterThinBloodTraitsDraft

  onThinBloodTraitsChange: (
    value: CharacterThinBloodTraitsDraft,
  ) => void

  thinBloodAlchemy: CharacterThinBloodAlchemyDraft

  onThinBloodAlchemyChange: (
    value: CharacterThinBloodAlchemyDraft,
  ) => void
}

const categoryLabels: Record<
  CharacterAdvantageCategory,
  string
> = {
  background: 'Trasfondos',
  merit: 'Méritos',
  flaw: 'Defectos',
}

const categories: CharacterAdvantageCategory[] = [
  'background',
  'merit',
  'flaw',
]

function createSelectionId(
  definitionKey: string,
): string {
  return [
    'advantage',
    definitionKey,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 8),
  ].join('-')
}

function isSimpleDefinition(
  definition: CharacterAdvantageDefinition,
): boolean {
  return (
    !definition.requiresInstanceDetails &&
    !definition.requiresParentSelection
  )
}

function getDefinitionSelections(
  value: CharacterAdvantagesDraft,
  definitionKey: string,
) {
  return value.selections.filter(
    (selection) =>
      selection.definitionKey ===
      definitionKey &&
      selection.origin === 'creation',
  )
}

export function AdvantagesStep({
  clanKey,
  value,
  onChange,
  thinBloodTraits,
  onThinBloodTraitsChange,
  thinBloodAlchemy,
  onThinBloodAlchemyChange,
}: AdvantagesStepProps) {
  const budget =
    getCharacterAdvantagesBudget(value)

  const advantageDelta =
    7 - budget.advantagePoints

  const flawDelta =
    2 - budget.flawPoints

  const thinBloodMerits =
    getThinBloodTraitDefinitionsByCategory(
      'merit',
    )

  const thinBloodFlaws =
    getThinBloodTraitDefinitionsByCategory(
      'flaw',
    )

  const isThinBlood =
    clanKey === 'thinBlood'

  const thinBlood =
    useThinBloodTraits({
      value: thinBloodTraits,
      onChange:
        onThinBloodTraitsChange,
      meritKeys:
        thinBloodMerits.map(
          (definition) =>
            definition.key,
        ),
      flawKeys:
        thinBloodFlaws.map(
          (definition) =>
            definition.key,
        ),
      characterKind:
        isThinBlood
          ? 'thinBlood'
          : 'clan',
    })

  function getBudgetMessage(
    delta: number,
    singular: string,
    plural: string,
  ) {
    if (delta === 0) {
      return 'Presupuesto completado.'
    }

    if (delta > 0) {
      return delta === 1
        ? `Falta 1 ${singular}.`
        : `Faltan ${delta} ${plural}.`
    }

    const excess = Math.abs(delta)

    return excess === 1
      ? `Has excedido el presupuesto en 1 ${singular}.`
      : `Has excedido el presupuesto en ${excess} ${plural}.`
  }

  function addSelection(
    definition: CharacterAdvantageDefinition,
    rating: number,
  ) {
    const existing =
      getDefinitionSelections(
        value,
        definition.key,
      )

    if (
      !definition.allowMultiple &&
      existing.length > 0
    ) {
      return
    }

    const selection:
      CharacterAdvantageSelectionDraft = {
        selectionId:
          createSelectionId(
            definition.key,
          ),

        definitionKey:
          definition.key,

        category:
          definition.category,

        rating,

        origin:
          'creation',

        details:
          createInitialAdvantageInstanceDetails(
            definition,
          ),
      }

    onChange({
      selections: [
        ...value.selections,
        selection,
      ],
    })
  }

  function removeSelection(
    selectionId: string,
  ) {
    onChange({
      selections:
        value.selections.filter(
          (selection) =>
            selection.selectionId !==
            selectionId,
        ),
    })
  }

  return (
    <div className="advantages-step">
      <div className="creation-step-heading">
        <span>Fase 6</span>

        <h2>
          Ventajas, Trasfondos y Defectos
        </h2>

        <p>
          Este panel permite probar el sistema
          de selección construido en el dominio.
          Los elementos complejos se incorporarán
          progresivamente.
        </p>
      </div>

      <section className="advantages-budget">
        <div
          className={
            advantageDelta === 0
              ? 'advantages-budget__item advantages-budget__item--valid'
              : advantageDelta < 0
                ? 'advantages-budget__item advantages-budget__item--invalid'
                : 'advantages-budget__item'
          }
        >
          <div>
            <span>
              Ventajas y Trasfondos
            </span>

            <small>
              {getBudgetMessage(
                advantageDelta,
                'punto',
                'puntos',
              )}
            </small>
          </div>

          <strong>
            {budget.advantagePoints}
            {' / 7'}
          </strong>
        </div>

        <div
          className={
            flawDelta === 0
              ? 'advantages-budget__item advantages-budget__item--valid'
              : flawDelta < 0
                ? 'advantages-budget__item advantages-budget__item--invalid'
                : 'advantages-budget__item'
          }
        >
          <div>
            <span>Defectos</span>

            <small>
              {getBudgetMessage(
                flawDelta,
                'punto',
                'puntos',
              )}
            </small>
          </div>

          <strong>
            {budget.flawPoints}
            {' / 2'}
          </strong>
        </div>
      </section>


      {isThinBlood && (
        <ThinBloodSection
          thinBlood={thinBlood}
          merits={thinBloodMerits}
          flaws={thinBloodFlaws}
          alchemy={thinBloodAlchemy}
          onAlchemyChange={
            onThinBloodAlchemyChange
          }
        />
      )}

      {categories.map(
        (category) => {
          const definitions =
            characterAdvantageDefinitions.filter(
              (definition) =>
                definition.category ===
                category,
            )

          return (
            <section
              key={category}
              className="advantages-category"
            >
              <header className="advantages-category__heading">
                <div>
                  <span>
                    Catálogo CORE
                  </span>

                  <h3>
                    {
                      categoryLabels[
                        category
                      ]
                    }
                  </h3>
                </div>

                <strong>
                  {definitions.length}
                </strong>
              </header>

              <div className="advantages-catalog-grid">
                {definitions.map(
                  (definition) => {
                    const selections =
                      getDefinitionSelections(
                        value,
                        definition.key,
                      )

                    const simple =
                      isSimpleDefinition(
                        definition,
                      )

                    const alreadySelected =
                      selections.length > 0

                    return (
                      <article
                        key={
                          definition.key
                        }
                        className={
                          alreadySelected
                            ? 'advantage-catalog-card advantage-catalog-card--selected'
                            : 'advantage-catalog-card'
                        }
                      >
                        <header>
                          <div>
                            <span>
                              {
                                categoryLabels[
                                  definition
                                    .category
                                ]
                              }
                            </span>

                            <h4>
                              {
                                definition.name
                              }
                            </h4>
                          </div>

                          {definition.sourcePage && (
                            <small>
                              pág.{' '}
                              {
                                definition.sourcePage
                              }
                            </small>
                          )}
                        </header>

                        <div className="advantage-catalog-card__ratings">
                          {definition.allowedRatings.map(
                            (rating) => (
                              <button
                                key={
                                  rating
                                }
                                type="button"
                                disabled={
                                  (
                                    !definition.allowMultiple &&
                                    alreadySelected
                                  )
                                }
                                onClick={() =>
                                  addSelection(
                                    definition,
                                    rating,
                                  )
                                }
                              >
                                {rating}
                              </button>
                            ),
                          )}
                        </div>

                        {!simple && (
                          <p className="advantage-catalog-card__pending">
                            Configuración específica
                            pendiente de interfaz.
                          </p>
                        )}

                        {simple &&
                          !definition.allowMultiple &&
                          alreadySelected && (
                            <p className="advantage-catalog-card__pending">
                              Ya seleccionado.
                            </p>
                          )}

                        {selections.length >
                          0 && (
                          <div className="advantage-selection-list">
                            {selections.map(
                              (
                                selection,
                              ) => (
                                <div
                                  key={
                                    selection.selectionId
                                  }
                                  className="advantage-selection-chip"
                                >
                                  <span>
                                    {
                                      selection.rating
                                    }{' '}
                                    pt
                                    {
                                      selection.rating ===
                                      1
                                        ? ''
                                        : 's'
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    aria-label={
                                      `Eliminar ${definition.name}`
                                    }
                                    onClick={() =>
                                      removeSelection(
                                        selection.selectionId,
                                      )
                                    }
                                  >
                                    ×
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </article>
                    )
                  },
                )}
              </div>
            </section>
          )
        },
      )}
    </div>
  )
}
