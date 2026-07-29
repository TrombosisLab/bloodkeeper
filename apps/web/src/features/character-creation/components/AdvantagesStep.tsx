import {
  characterAdvantageDefinitions,
} from '../data/character-advantage-definitions'

import {
  getCharacterAdvantagesBudget,
} from '../domain/advantage-rules'

import {
  canShowAdvantageDefinition,
} from '../domain/advantage-visibility-rules'

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

import {
  AdvantageInstanceDetailsEditor,
} from './advantages/AdvantageInstanceDetailsEditor'

import {
  AdvantageRatingControl,
} from './advantages/AdvantageRatingControl'

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


function getChildAdvantageDefinitions(
  parentDefinitionKey: string,
) {
  return characterAdvantageDefinitions.filter(
    (definition) =>
      (
        definition.requiresParentSelection === true ||
        definition.allowsOptionalParentSelection === true
      ) &&
      definition.allowedParentDefinitionKeys?.includes(
        parentDefinitionKey,
      ),
  )
}

function getChildAdvantageDefinitionsByCategory(
  parentDefinitionKey: string,
  category: 'merit' | 'flaw',
) {
  return getChildAdvantageDefinitions(
    parentDefinitionKey,
  ).filter(
    (definition) =>
      definition.category === category,
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

  function resolveParentSelectionId(
    definition: CharacterAdvantageDefinition,
  ): string | undefined {
    if (
      definition.requiresParentSelection !== true
    ) {
      return undefined
    }

    return value.selections.find(
      (selection) =>
        definition.allowedParentDefinitionKeys?.includes(
          selection.definitionKey,
        ),
    )?.selectionId
  }

  function addSelection(
    definition: CharacterAdvantageDefinition,
    rating: number,
    parentSelectionId?: string,
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

        parentSelectionId:
          parentSelectionId ??
          resolveParentSelectionId(
            definition,
          ),

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


  function updateSelectionRating(
    selectionId: string,
    rating: number,
  ) {
    onChange({
      selections:
        value.selections.map(
          (selection) =>
            selection.selectionId ===
            selectionId
              ? {
                  ...selection,
                  rating,
                }
              : selection,
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
                  category &&
                (
                  definition.requiresParentSelection !== true ||
                  definition.allowsOptionalParentSelection === true
                ) &&
                canShowAdvantageDefinition(
                  definition,
                  value,
                ),
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

              <div
              className={
                "advantages-catalog-grid advantages-catalog-grid--merit"
              }
            >
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
                            ? 'advantage-sheet-entry advantage-sheet-entry--selected'
                            : 'advantage-sheet-entry'
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
                          {definition.instanceDetailsKind ===
                            'allies' ? (
                            (() => {
                              const selected =
                                selections[0]

                              if (!selected) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addSelection(
                                        definition,
                                        0,
                                      )
                                    }
                                  >
                                    Configurar
                                  </button>
                                )
                              }

                              return (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeSelection(
                                      selected.selectionId,
                                    )
                                  }
                                >
                                  Quitar
                                </button>
                              )
                            })()
                          ) : definition.instanceDetailsKind ===
                            'contact' ? (
                            (() => {
                              const selected =
                                selections[0]

                              if (!selected) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addSelection(
                                        definition,
                                        1,
                                      )
                                    }
                                  >
                                    Configurar
                                  </button>
                                )
                              }

                              return (
                                <AdvantageRatingControl
                                  value={
                                    selected.rating
                                  }
                                  min={1}
                                  max={5}
                                  onChange={(
                                    rating,
                                  ) =>
                                    updateSelectionRating(
                                      selected.selectionId,
                                      rating,
                                    )
                                  }
                                  onRemove={() =>
                                    removeSelection(
                                      selected.selectionId,
                                    )
                                  }
                                />
                              )
                            })()
                          ) : definition.instanceDetailsKind ===
                            'retainer' ? (
                            (() => {
                              const selected =
                                selections[0]

                              if (!selected) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addSelection(
                                        definition,
                                        1,
                                      )
                                    }
                                  >
                                    Configurar
                                  </button>
                                )
                              }

                              return (
                                <AdvantageRatingControl
                                  value={
                                    selected.rating
                                  }
                                  min={1}
                                  max={3}
                                  onChange={(
                                    rating,
                                  ) =>
                                    updateSelectionRating(
                                      selected.selectionId,
                                      rating,
                                    )
                                  }
                                  onRemove={() =>
                                    removeSelection(
                                      selected.selectionId,
                                    )
                                  }
                                />
                              )
                            })()
                          ) : definition.instanceDetailsKind ===
                            'herd' ? (
                            (() => {
                              return (
                                <div className="advantage-instance-rating-list">
                                  {selections.map(
                                    (selection) => (
                                      <AdvantageRatingControl
                                        key={
                                          selection.selectionId
                                        }
                                        value={
                                          selection.rating
                                        }
                                        min={1}
                                        max={5}
                                        onChange={(
                                          rating,
                                        ) =>
                                          updateSelectionRating(
                                            selection.selectionId,
                                            rating,
                                          )
                                        }
                                        onRemove={() =>
                                          removeSelection(
                                            selection.selectionId,
                                          )
                                        }
                                      />
                                    ),
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      addSelection(
                                        definition,
                                        1,
                                      )
                                    }
                                  >
                                    Añadir Rebaño
                                  </button>
                                </div>
                              )
                            })()
                          ) : definition.instanceDetailsKind ===
                            'resources' ? (
                            (() => {
                              return (
                                <div className="advantage-instance-rating-list">
                                  {selections.map(
                                    (selection) => (
                                      <AdvantageRatingControl
                                        key={
                                          selection.selectionId
                                        }
                                        value={
                                          selection.rating
                                        }
                                        min={1}
                                        max={5}
                                        onChange={(
                                          rating,
                                        ) =>
                                          updateSelectionRating(
                                            selection.selectionId,
                                            rating,
                                          )
                                        }
                                        onRemove={() =>
                                          removeSelection(
                                            selection.selectionId,
                                          )
                                        }
                                      />
                                    ),
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      addSelection(
                                        definition,
                                        1,
                                      )
                                    }
                                  >
                                    Añadir Recursos
                                  </button>
                                </div>
                              )
                            })()
                          ) : definition.instanceDetailsKind ===
                            'status' ? (
                            (() => {
                              return (
                                <div className="advantage-instance-rating-list">
                                  {selections.map(
                                    (selection) => (
                                      <AdvantageRatingControl
                                        key={
                                          selection.selectionId
                                        }
                                        value={
                                          selection.rating
                                        }
                                        min={1}
                                        max={5}
                                        onChange={(
                                          rating,
                                        ) =>
                                          updateSelectionRating(
                                            selection.selectionId,
                                            rating,
                                          )
                                        }
                                        onRemove={() =>
                                          removeSelection(
                                            selection.selectionId,
                                          )
                                        }
                                      />
                                    ),
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      addSelection(
                                        definition,
                                        1,
                                      )
                                    }
                                  >
                                    Añadir Estatus
                                  </button>
                                </div>
                              )
                            })()
                          ) : definition.instanceDetailsKind ===
                            'mask' ? (
                            (() => {
                              const selected =
                                selections[0]

                              if (!selected) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addSelection(
                                        definition,
                                        1,
                                      )
                                    }
                                  >
                                    Configurar
                                  </button>
                                )
                              }

                              return (
                                <AdvantageRatingControl
                                  value={
                                    selected.rating
                                  }
                                  min={1}
                                  max={2}
                                  onChange={(
                                    rating,
                                  ) =>
                                    updateSelectionRating(
                                      selected.selectionId,
                                      rating,
                                    )
                                  }
                                  onRemove={() =>
                                    removeSelection(
                                      selected.selectionId,
                                    )
                                  }
                                />
                              )
                            })()
                          ) : definition.instanceDetailsKind ===
                            'haven' ? (
                            (() => {
                              const selected =
                                selections[0]

                              if (!selected) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addSelection(
                                        definition,
                                        1,
                                      )
                                    }
                                  >
                                    Configurar
                                  </button>
                                )
                              }

                              return (
                                <AdvantageRatingControl
                                  value={
                                    selected.rating
                                  }
                                  min={1}
                                  max={3}
                                  onChange={(
                                    rating,
                                  ) =>
                                    updateSelectionRating(
                                      selected.selectionId,
                                      rating,
                                    )
                                  }
                                  onRemove={() =>
                                    removeSelection(
                                      selected.selectionId,
                                    )
                                  }
                                />
                              )
                            })()
                          ) : (
                            (() => {
                              const selected =
                                selections[0]

                              if (!selected) {
                                return (
                                  <AdvantageRatingControl
                                    value={
                                      definition.allowedRatings.length === 1
                                        ? definition.allowedRatings[0]
                                        : 0
                                    }
                                    fixedRating={
                                      definition.allowedRatings.length === 1
                                    }
                                    allowedRatings={
                                      definition.allowedRatings
                                    }
                                    min={0}
                                    max={
                                      definition.allowedRatings[
                                        definition.allowedRatings.length - 1
                                      ]
                                    }
                                    onChange={(
                                      rating,
                                    ) =>
                                      addSelection(
                                        definition,
                                        definition.allowedRatings.length === 1
                                          ? definition.allowedRatings[0]
                                          : rating,
                                      )
                                    }
                                  />
                                )
                              }

                              return (
                                <AdvantageRatingControl
                                  value={
                                    selected.rating
                                  }
                                  min={
                                    definition.allowedRatings[0]
                                  }
                                  max={
                                    definition.allowedRatings[
                                      definition.allowedRatings.length - 1
                                    ]
                                  }
                                  allowedRatings={
                                    definition.allowedRatings
                                  }
                                  onChange={(
                                    rating,
                                  ) =>
                                    updateSelectionRating(
                                      selected.selectionId,
                                      rating,
                                    )
                                  }
                                  onRemove={() =>
                                    removeSelection(
                                      selected.selectionId,
                                    )
                                  }
                                />
                              )
                            })()
                          )}
                        </div>

                        {!simple &&
                          selections.map(
                            (selection) => (
                              <AdvantageInstanceDetailsEditor
                                key={
                                  selection.selectionId
                                }
                                selection={
                                  selection
                                }
                                onChange={(
                                  updated,
                                ) =>
                                  onChange({
                                    selections:
                                      value.selections.map(
                                        (current) =>
                                          current.selectionId ===
                                          updated.selectionId
                                            ? updated
                                            : current,
                                      ),
                                  })
                                }
                              />
                            ),
                          )}

                        {simple &&
                          !definition.allowMultiple &&
                          alreadySelected && (
                            <p className="advantage-catalog-card__pending">
                              Ya seleccionado.
                            </p>
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
      {value.selections
        .filter(
          (selection) =>
            selection.definitionKey === 'haven',
        )
        .length > 0 && (
          <section
            className="advantages-category"
          >
            <header className="advantages-category__heading">
              <div>
                <span>
                  Catálogo CORE
                </span>

                <h3>
                  Méritos de Refugio
                </h3>
              </div>
            </header>

            <div
              className={
                "advantages-catalog-grid advantages-catalog-grid--merit"
              }
            >
              {value.selections
                .filter(
                  (selection) =>
                    selection.definitionKey === 'haven',
                )
                .flatMap(
                  (haven) =>
                    getChildAdvantageDefinitionsByCategory(
                      'haven',
                        'merit',
                    ).map(
                      (definition) => (
                        <article
                          key={
                            definition.key +
                            haven.selectionId
                          }
                          className={
                            getDefinitionSelections(
                              value,
                              definition.key,
                            ).some(
                              (selection) =>
                                selection.parentSelectionId ===
                                haven.selectionId,
                            )
                              ? 'advantage-sheet-entry advantage-sheet-entry--selected'
                              : 'advantage-sheet-entry'
                          }
                        >
                          <h4>
                            {definition.name}
                          </h4>

                          <div className="advantage-catalog-card__ratings">
                            {(() => {
                              const selected =
                                getDefinitionSelections(
                                  value,
                                  definition.key,
                                ).find(
                                  (selection) =>
                                    selection.parentSelectionId ===
                                    haven.selectionId,
                                )

                              if (!selected) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addSelection(
                                        definition,
                                        1,
                                        haven.selectionId,
                                      )
                                    }
                                  >
                                    Configurar
                                  </button>
                                )
                              }

                              return (
                                <AdvantageRatingControl
                                  value={
                                    selected.rating
                                  }
                                  min={1}
                                  max={
                                    definition.allowedRatings[
                                      definition.allowedRatings.length - 1
                                    ]
                                  }
                                  allowedRatings={
                                    definition.allowedRatings
                                  }
                                  onChange={(
                                    rating,
                                  ) =>
                                    updateSelectionRating(
                                      selected.selectionId,
                                      rating,
                                    )
                                  }
                                  onRemove={() =>
                                    removeSelection(
                                      selected.selectionId,
                                    )
                                  }
                                />
                              )
                            })()}
                          </div>
                        </article>
                      ),
                    ),
                )}
            </div>
          </section>
        )}

        {value.selections
          .filter(
            (selection) =>
              selection.definitionKey === 'haven',
          )
          .length > 0 && (
            <section
              className="advantages-category"
            >
              <header className="advantages-category__heading">
                <div>
                  <span>
                    Catálogo CORE
                  </span>

                  <h3>
                    Defectos de Refugio
                  </h3>
                </div>
              </header>

              <div
              className={
                "advantages-catalog-grid advantages-catalog-grid--flaw"
              }
            >
                {value.selections
                  .filter(
                    (selection) =>
                      selection.definitionKey === 'haven',
                  )
                  .flatMap(
                    (haven) =>
                      getChildAdvantageDefinitionsByCategory(
                        'haven',
                        'flaw',
                      ).map(
                        (definition) => (
                          <article
                            key={
                              definition.key +
                              haven.selectionId
                            }
                            className="advantage-sheet-entry"
                          >
                            <h4>
                              {definition.name}
                            </h4>

                                                          <div className="advantage-catalog-card__ratings">
                                {(() => {
                                  const selected =
                                    getDefinitionSelections(
                                      value,
                                      definition.key,
                                    ).find(
                                      (selection) =>
                                        selection.parentSelectionId ===
                                        haven.selectionId,
                                    )

                                  if (!selected) {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          addSelection(
                                            definition,
                                            definition.allowedRatings[0],
                                            haven.selectionId,
                                          )
                                        }
                                      >
                                        Configurar
                                      </button>
                                    )
                                  }

                                  return (
                                    <AdvantageRatingControl
                                      value={selected.rating}
                                      min={1}
                                      max={definition.allowedRatings[definition.allowedRatings.length - 1]}
                                      allowedRatings={
                                        definition.allowedRatings
                                      }
                                      onChange={(rating) =>
                                        updateSelectionRating(
                                          selected.selectionId,
                                          rating,
                                        )
                                      }
                                      onRemove={() =>
                                        removeSelection(
                                          selected.selectionId,
                                        )
                                      }
                                    />
                                  )
                                })()}
                              </div>
                          </article>
                        ),
                      ),
                  )}
              </div>
            </section>
          )}

    </div>
  )
}