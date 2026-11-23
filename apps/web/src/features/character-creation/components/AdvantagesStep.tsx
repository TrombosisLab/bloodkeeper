import { useState } from 'react'

import {
  characterAdvantageDefinitions,
} from '../data/character-advantage-definitions'

import {
  filterAdvantageCatalogDefinitions,
  groupAdvantageCatalogDefinitions,
} from '../data/advantage-catalog-groups'

import {
  getCharacterAdvantagesBudget,
} from '../domain/advantage-rules'

import {
  canShowAdvantageDefinition,
} from '../domain/advantage-visibility-rules'

import {
  getActiveCharacterAdvantageDefinitions,
} from '../domain/advantage-catalog-rules'

import {
  getCharacterAdvantageNarrativeState,
} from '../domain/advantage-functional-model'

import {
  createInitialAdvantageInstanceDetails,
} from '../domain/advantage-instance-details-rules'

import {
  isHumanAdvantageDefinitionAllowed,
} from '../domain/session-zero-creation-rules'

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
  AdvantageInstanceDetailsDialog,
} from './advantages/AdvantageInstanceDetailsDialog'

import {
  AdvantageCatalogInfoDialog,
} from './advantages/AdvantageCatalogInfoDialog'

import {
  AdvantageRatingControl,
} from './advantages/AdvantageRatingControl'

import {
  LoresheetSelector,
} from './advantages/LoresheetSelector'

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


import type {
  CharacterGeneration,
} from '../types/character-generation.types'

import type {
  CharacterDraftApiCreationMode,
  CharacterDraftApiNature,
} from '../types/character-draft-api.types'

interface AdvantagesStepProps {
  creationMode: CharacterDraftApiCreationMode

  profileNature: CharacterDraftApiNature

  showThinBloodState?: boolean

  automaticGrantDetailsReadOnly?: boolean

  clanKey: ClanKey | null

  generation: CharacterGeneration | null

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
  return getActiveCharacterAdvantageDefinitions(
    characterAdvantageDefinitions,
  ).filter(
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
  creationMode,
  profileNature,
  showThinBloodState = true,
  automaticGrantDetailsReadOnly = false,
  clanKey,
  generation,
  value,
  onChange,
  thinBloodTraits,
  onThinBloodTraitsChange,
  thinBloodAlchemy,
  onThinBloodAlchemyChange,
}: AdvantagesStepProps) {
  const [
    havenConfigurationOpen,
    setHavenConfigurationOpen,
  ] = useState(true)

  const [catalogSearchTerm, setCatalogSearchTerm] =
    useState('')

  const [editingDetailsSelectionId, setEditingDetailsSelectionId] =
    useState<string | null>(null)

  const [catalogInfo, setCatalogInfo] = useState<{
    definition: CharacterAdvantageDefinition
    description: string
  } | null>(null)

  async function openCatalogInfo(
    definition: CharacterAdvantageDefinition,
  ) {
    const { advantageCatalogHelp } = await import(
      '../data/advantage-catalog-help'
    )
    setCatalogInfo({
      definition,
      description: advantageCatalogHelp[definition.key]
        ?? 'Consulta con el Narrador el efecto concreto de este rasgo y cómo aplicarlo en la crónica.',
    })
  }

  const sessionZero =
    creationMode === 'sessionZero' &&
    profileNature === 'human'

  const budget =
    getCharacterAdvantagesBudget(value)

  const predatorTypeSelections =
    sessionZero
      ? []
      : value.selections.filter(
          (selection) =>
            selection.origin ===
            'predatorType',
        )

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
    showThinBloodState &&
    !sessionZero &&
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

    const alreadyGranted =
      value.selections.some(
        (selection) =>
          selection.definitionKey ===
          definition.key,
      )

    if (
      !definition.allowMultiple &&
      alreadyGranted
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

    if (definition.requiresInstanceDetails === true) {
      setEditingDetailsSelectionId(selection.selectionId)
    }
  }

  function removeSelection(
    selectionId: string,
  ) {
    if (editingDetailsSelectionId === selectionId) {
      setEditingDetailsSelectionId(null)
    }

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

  function updateSelectionDetails(
    updated: CharacterAdvantageSelectionDraft,
  ) {
    onChange({
      selections: value.selections.map((current) =>
        current.selectionId === updated.selectionId
          ? updated
          : current,
      ),
    })
  }

  const editingDetailsSelection =
    value.selections.find(
      (selection) =>
        selection.selectionId === editingDetailsSelectionId,
    )

  const editingDetailsDefinition =
    editingDetailsSelection
      ? characterAdvantageDefinitions.find(
          (definition) =>
            definition.key === editingDetailsSelection.definitionKey,
        )
      : undefined

  return (
    <div className="advantages-step">
      <div className="creation-step-heading">
        <span>Fase 6</span>

        <h2>
          Ventajas, Trasfondos y Defectos
        </h2>

        <p>
          {sessionZero
            ? 'Selecciona únicamente Ventajas, Trasfondos y Defectos válidos durante la fase humana.'
            : 'Este panel permite probar el sistema de selección construido en el dominio. Los elementos complejos se incorporarán progresivamente.'}
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

      <section className="advantages-catalog-tools" aria-label="Buscar y revisar selecciones">
        <label htmlFor="advantages-catalog-search">
          Buscar en Trasfondos, Méritos y Defectos
        </label>
        <div className="advantages-catalog-tools__search-row">
          <input
            id="advantages-catalog-search"
            type="search"
            value={catalogSearchTerm}
            onChange={(event) => setCatalogSearchTerm(event.currentTarget.value)}
            placeholder="Buscar por nombre o tipo…"
          />
          {catalogSearchTerm && (
            <button
              type="button"
              className="advantages-catalog-tools__clear"
              onClick={() => setCatalogSearchTerm('')}
            >
              Restablecer
            </button>
          )}
        </div>
        <div className="advantages-catalog-tools__selected" aria-live="polite">
          <strong>Seleccionados</strong>
          {value.selections.filter((selection) => selection.origin === 'creation').length === 0 ? (
            <span>Aún no has elegido rasgos.</span>
          ) : (
            <ul>
              {value.selections
                .filter((selection) => selection.origin === 'creation')
                .map((selection) => {
                  const definition = characterAdvantageDefinitions.find(
                    (candidate) => candidate.key === selection.definitionKey,
                  )
                  return (
                    <li key={selection.selectionId}>
                      {definition?.name ?? selection.definitionKey}
                      {' · '}{categoryLabels[selection.category]}
                      {' · '}{'•'.repeat(selection.rating)}
                    </li>
                  )
                })}
            </ul>
          )}
        </div>
      </section>


      {predatorTypeSelections.length > 0 && (
        <section className="advantages-category">
          <header className="advantages-category__heading">
            <div>
              <span>Tipo de Depredador</span>

              <h3>
                Concesiones automáticas
              </h3>

              <p>
                No consumen el presupuesto normal 7/2
                y no se seleccionan de nuevo.
              </p>
            </div>

            <strong>
              {predatorTypeSelections.length}
            </strong>
          </header>

          <div className="advantages-instance-compact-list">
            {predatorTypeSelections.map(
              (selection) => {
                const definition =
                  characterAdvantageDefinitions.find(
                    (candidate) =>
                      candidate.key ===
                      selection.definitionKey,
                  )

                const narrativeState = definition
                  ? getCharacterAdvantageNarrativeState(
                      definition,
                      selection.details,
                    )
                  : { status: 'pending' as const }

                return (
                  <article
                    key={selection.selectionId}
                    className="advantage-instance-compact-row"
                  >
                    <div className="advantage-instance-compact-row__label">
                      <strong>
                        {definition?.name ?? selection.definitionKey}
                      </strong>
                      <span>
                        Concedido por el Tipo de Depredador · {'•'.repeat(selection.rating)}
                      </span>
                    </div>

                    {definition?.requiresInstanceDetails ===
                      true &&
                      !automaticGrantDetailsReadOnly && (
                      <div className="advantage-instance-compact-row__action">
                        <small data-state={narrativeState.status}>
                          {narrativeState.status === 'pending' ? 'Pendiente' : 'Configurado'}
                        </small>
                        <button
                          type="button"
                          className="advantage-action-button"
                          onClick={() => setEditingDetailsSelectionId(selection.selectionId)}
                        >
                          {narrativeState.status === 'pending' ? 'Completar detalles' : 'Editar detalles'}
                        </button>
                      </div>
                    )}
                  </article>
                )
              },
            )}
          </div>
        </section>
      )}

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

      {!sessionZero ? (
        <LoresheetSelector
          clanKey={clanKey}
          value={value}
          onChange={onChange}
        />
      ) : null}

      {categories.map(
        (category) => {
          const definitions =
            getActiveCharacterAdvantageDefinitions(
              characterAdvantageDefinitions,
              category,
            ).filter(
              (definition) =>
                definition.instanceDetailsKind !==
                'loresheet',
            ).filter(
              (definition) =>
                !definition.allowedParentDefinitionKeys
                  ?.length,
            ).filter(
              (definition) =>
                (
                  definition.requiresParentSelection !== true ||
                  definition.allowsOptionalParentSelection === true
                ) &&
                (
                  sessionZero
                    ? isHumanAdvantageDefinitionAllowed(
                        definition,
                      )
                    : canShowAdvantageDefinition(
                        definition,
                        value,
                        {
                          clanKey,
                          generation,
                        },
                      )
                ),
            ).filter(
              (definition) =>
                definition.allowMultiple ||
                !predatorTypeSelections.some(
                  (selection) =>
                    selection.definitionKey ===
                    definition.key,
                ),
            ).filter(
              (definition) =>
                filterAdvantageCatalogDefinitions(
                  [definition],
                  catalogSearchTerm,
                ).length > 0,
            )

          if (definitions.length === 0) {
            return null
          }

          return (
            <section
              key={category}
              className={
                `advantages-category advantages-category--${category}`
              }
            >
              <details
                className="advantages-catalog-category"
                open={catalogSearchTerm.trim() ? true : undefined}
              >
                <summary className="advantages-category__heading">
                  <div>
                    <span>Catálogo</span>
                    <h3>{categoryLabels[category]}</h3>
                  </div>
                  <strong>
                    {definitions.length} disponibles
                    {' · '}
                    {value.selections.filter(
                      (selection) =>
                        selection.origin === 'creation' &&
                        selection.category === category,
                    ).length} seleccionados
                  </strong>
                </summary>

                <div className="advantages-catalog-groups">
                  {groupAdvantageCatalogDefinitions(definitions).map((group) => {
                    const selectedCount = group.definitions.filter(
                      (definition) =>
                        getDefinitionSelections(value, definition.key).length > 0,
                    ).length

                    return (
                      <details
                        key={group.key}
                        className="advantages-catalog-subgroup"
                        open={catalogSearchTerm.trim() ? true : undefined}
                      >
                        <summary>
                          <span>{group.label}</span>
                          <small>
                            {group.definitions.length} rasgos
                            {selectedCount > 0 ? ` · ${selectedCount} seleccionados` : ''}
                          </small>
                        </summary>
                        <div className={`advantages-catalog-grid advantages-catalog-grid--${category}`}>
                  {group.definitions.map(
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

                          <button
                            type="button"
                            className="advantage-catalog-info-button"
                            aria-label={`Información sobre ${definition.name}`}
                            onClick={() => void openCatalogInfo(definition)}
                          >
                            i
                          </button>

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
                                  className="advantage-action-button"
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
                                  className="advantage-action-button"
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
                                  className="advantage-action-button"
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
                                  className="advantage-action-button"
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
                                  className="advantage-action-button"
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
                                  className="advantage-action-button"
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
                                  className="advantage-action-button"
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
                                  className="advantage-action-button"
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
                              const fixedRating =
                                definition.allowedRatings.length === 1
                              const rating =
                                definition.allowedRatings[0]

                              if (!selected) {
                                if (fixedRating) {
                                  return (
                                    <div className="advantage-fixed-rating-control">
                                      <span className="advantage-fixed-rating-control__status">
                                        Valor fijo · {rating}{' '}
                                        {rating === 1 ? 'punto' : 'puntos'}
                                      </span>
                                      <button
                                        type="button"
                                        className="advantage-action-button"
                                        aria-pressed="false"
                                        onClick={() =>
                                          addSelection(
                                            definition,
                                            rating,
                                          )
                                        }
                                      >
                                        Seleccionar
                                      </button>
                                    </div>
                                  )
                                }

                                return (
                                  <AdvantageRatingControl
                                    value={0}
                                    allowedRatings={
                                      definition.allowedRatings
                                    }
                                    min={0}
                                    max={
                                      definition.allowedRatings[
                                        definition.allowedRatings.length - 1
                                      ]
                                    }
                                    onChange={(rating) =>
                                      addSelection(
                                        definition,
                                        rating,
                                      )
                                    }
                                  />
                                )
                              }

                              if (fixedRating) {
                                return (
                                  <div className="advantage-fixed-rating-control advantage-fixed-rating-control--selected">
                                    <span className="advantage-fixed-rating-control__status">
                                      Seleccionada · {selected.rating}{' '}
                                      {selected.rating === 1 ? 'punto' : 'puntos'}
                                    </span>
                                    <button
                                      type="button"
                                      className="advantage-action-button"
                                      aria-pressed="true"
                                      onClick={() =>
                                        removeSelection(
                                          selected.selectionId,
                                        )
                                      }
                                    >
                                      Quitar
                                    </button>
                                  </div>
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

                        {category !== 'background' &&
                          !simple &&
                          selections.map(
                            (selection) => {
                              const narrativeState =
                                getCharacterAdvantageNarrativeState(
                                  definition,
                                  selection.details,
                                )

                              return (
                                <div
                                  key={
                                    selection.selectionId
                                  }
                                  className="advantage-instance-block"
                                >
                                  <div className="advantage-instance-compact-row__action">
                                    <small data-state={narrativeState.status}>
                                      {narrativeState.status === 'pending' ? 'Pendiente' : 'Configurado'}
                                    </small>
                                    <button
                                      type="button"
                                      className="advantage-action-button"
                                      onClick={() => setEditingDetailsSelectionId(selection.selectionId)}
                                    >
                                      {narrativeState.status === 'pending' ? 'Completar detalles' : 'Editar detalles'}
                                    </button>
                                  </div>
                                </div>
                              )
                            },
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
                      </details>
                    )
                  })}
                </div>
              </details>
            </section>
          )
        },
      )}
      {(() => {
        const configurableBackgroundSelections =
          value.selections.filter(
            (selection) => {
              if (
                selection.category !==
                  'background' ||
                selection.origin !==
                  'creation'
              ) {
                return false
              }

              const definition =
                characterAdvantageDefinitions.find(
                  (candidate) =>
                    candidate.key ===
                    selection.definitionKey,
                )

              return (
                definition
                  ?.requiresInstanceDetails ===
                true
              )
            },
          )

        if (
          configurableBackgroundSelections.length ===
          0
        ) {
          return null
        }

        return (
          <section className="advantages-background-configurations">
            <header className="advantages-category__heading">
              <div>
                <span>
                  Información adicional
                </span>

                <h3>
                  Trasfondos seleccionados
                </h3>

                <p>
                  Los datos se abren solo cuando quieras editarlos.
                </p>
              </div>

              <strong>
                {
                  configurableBackgroundSelections
                    .length
                }
              </strong>
            </header>

            <div className="advantages-instance-compact-list">
              {configurableBackgroundSelections.map(
                (selection) => {
                  const definition =
                    characterAdvantageDefinitions.find(
                      (candidate) =>
                        candidate.key ===
                        selection.definitionKey,
                    )

                  if (!definition) {
                    return null
                  }

                  const narrativeState =
                    getCharacterAdvantageNarrativeState(
                      definition,
                      selection.details,
                    )

                  return (
                    <article
                      key={
                        selection.selectionId
                      }
                      className="advantage-instance-compact-row"
                    >
                      <div className="advantage-instance-compact-row__label">
                        <strong>
                          {definition.name}
                        </strong>
                        <span>
                          Nivel {selection.rating} · {'•'.repeat(selection.rating)}
                        </span>
                      </div>
                      <div className="advantage-instance-compact-row__action">
                        <small data-state={narrativeState.status}>
                          {narrativeState.status === 'pending' ? 'Pendiente' : 'Configurado'}
                        </small>
                        <button
                          type="button"
                          className="advantage-action-button"
                          onClick={() => setEditingDetailsSelectionId(selection.selectionId)}
                        >
                          {narrativeState.status === 'pending' ? 'Completar detalles' : 'Editar detalles'}
                        </button>
                      </div>
                    </article>
                  )
                },
              )}
            </div>
          </section>
        )
      })()}

      {value.selections.some(
        (selection) =>
          selection.definitionKey === 'haven',
      ) && (
        <section className="advantages-haven-configuration-toggle">
          <header className="advantages-category__heading">
            <div>
              <span>
                Configuración del Trasfondo
              </span>

              <h3>
                Refugio
              </h3>

              <p>
                Mejoras y Defectos asociados
                exclusivamente a este Trasfondo.
              </p>
            </div>

            <button
              type="button"
              className="advantages-haven-configuration-toggle__button"
              aria-expanded={
                havenConfigurationOpen
              }
              onClick={() =>
                setHavenConfigurationOpen(
                  (current) => !current,
                )
              }
            >
              {havenConfigurationOpen
                ? 'Contraer'
                : 'Desplegar'}
            </button>
          </header>
        </section>
      )}

      {value.selections
        .filter(
          (selection) =>
            selection.definitionKey === 'haven',
        )
        .length > 0 &&
        havenConfigurationOpen && (
          <section
            className="advantages-category advantages-category--haven-merits"
          >
            <header className="advantages-category__heading">
              <div>
                <span>
                  Configuración del Trasfondo
                </span>

                <h3>
                  Mejoras de Refugio
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
                          <header className="advantage-sheet-entry__compact-header">
                            <h4>{definition.name}</h4>
                            <button
                              type="button"
                              className="advantage-catalog-info-button"
                              aria-label={`Información sobre ${definition.name}`}
                              onClick={() => void openCatalogInfo(definition)}
                            >
                              i
                            </button>
                          </header>

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
                                  className="advantage-action-button"
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
          .length > 0 &&
        havenConfigurationOpen && (
            <section
              className="advantages-category advantages-category--haven-flaws"
            >
              <header className="advantages-category__heading">
                <div>
                  <span>
                    Configuración del Trasfondo
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
                            <header className="advantage-sheet-entry__compact-header">
                              <h4>{definition.name}</h4>
                              <button
                                type="button"
                                className="advantage-catalog-info-button"
                                aria-label={`Información sobre ${definition.name}`}
                                onClick={() => void openCatalogInfo(definition)}
                              >
                                i
                              </button>
                            </header>

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
                                      className="advantage-action-button"
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

      {editingDetailsSelection && editingDetailsDefinition ? (
        <AdvantageInstanceDetailsDialog
          key={editingDetailsSelection.selectionId}
          selection={editingDetailsSelection}
          title={editingDetailsDefinition.name}
          onSave={updateSelectionDetails}
          onClose={() => setEditingDetailsSelectionId(null)}
        />
      ) : null}
      {catalogInfo ? (
        <AdvantageCatalogInfoDialog
          key={catalogInfo.definition.key}
          definition={catalogInfo.definition}
          categoryLabel={categoryLabels[catalogInfo.definition.category]}
          description={catalogInfo.description}
          onClose={() => setCatalogInfo(null)}
        />
      ) : null}
    </div>
  )
}
