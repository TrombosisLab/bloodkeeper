import {
  useEffect,
  useState,
} from 'react'

import {
  characterAdvantageDefinitions,
} from '../../data/character-advantage-definitions'

import {
  characterCoreLoresheetDefinitions,
} from '../../data/core-loresheet-definitions'

import {
  getActiveCharacterAdvantageDefinitions,
} from '../../domain/advantage-catalog-rules'

import {
  validateCharacterLoresheetEligibility,
} from '../../domain/loresheet-eligibility-rules'

import type {
  CharacterAdvantageSelectionDraft,
  CharacterAdvantagesDraft,
} from '../../types/character-advantages-draft.types'

import type {
  CharacterLoresheetDefinition,
} from '../../types/character-loresheet-definition.types'

import type {
  ClanKey,
} from '../../types/clan.types'

interface LoresheetSelectorProps {
  clanKey: ClanKey | null

  value: CharacterAdvantagesDraft

  onChange: (
    value: CharacterAdvantagesDraft,
  ) => void
}

function createLoresheetSelectionId(
  loresheetKey: string,
  benefitKey: string,
): string {
  return [
    'advantage',
    'loresheet',
    loresheetKey,
    benefitKey,
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2, 8),
  ].join('-')
}

function isCreationLoresheetSelection(
  selection: CharacterAdvantageSelectionDraft,
): boolean {
  return (
    selection.origin === 'creation' &&
    selection.details?.kind ===
      'loresheet'
  )
}

function characterKindForClan(
  clanKey: ClanKey | null,
) {
  if (clanKey === 'thinBlood') {
    return 'thinBlood' as const
  }

  if (clanKey === 'caitiff') {
    return 'caitiff' as const
  }

  return 'standard' as const
}

export function LoresheetSelector({
  clanKey,
  value,
  onChange,
}: LoresheetSelectorProps) {
  const loresheetDefinition =
    getActiveCharacterAdvantageDefinitions(
      characterAdvantageDefinitions,
      'merit',
    ).find(
      (definition) =>
        definition.instanceDetailsKind ===
        'loresheet',
    )

  const selections =
    value.selections.filter(
      isCreationLoresheetSelection,
    )

  const persistedLoresheetKey =
    selections[0]?.details?.kind ===
    'loresheet'
      ? selections[0].details.loresheetKey
      : ''

  const [
    selectedLoresheetKey,
    setSelectedLoresheetKey,
  ] = useState(
    persistedLoresheetKey,
  )

  useEffect(
    () => {
      if (persistedLoresheetKey) {
        setSelectedLoresheetKey(
          persistedLoresheetKey,
        )
      }
    },
    [persistedLoresheetKey],
  )

  if (!loresheetDefinition) {
    return null
  }

  /*
   * Alias no nullable tras el guard.
   *
   * TypeScript no conserva el narrowing del valor capturado
   * dentro de callbacks definidos más abajo, aunque la referencia
   * sea const. Este alias fija el contrato ya comprobado sin
   * cambiar comportamiento ni datos.
   */
  const activeLoresheetDefinition =
    loresheetDefinition

  const context = {
    characterKind:
      characterKindForClan(
        clanKey,
      ),
    clanKey,
  }

  const selectedLoresheet:
    CharacterLoresheetDefinition | null =
    characterCoreLoresheetDefinitions.find(
      (definition) =>
        definition.key ===
        selectedLoresheetKey,
    ) ?? null

  const selectedEligibility =
    selectedLoresheet
      ? validateCharacterLoresheetEligibility(
          selectedLoresheet,
          context,
        )
      : null

  function changeLoresheet(
    loresheetKey: string,
  ) {
    setSelectedLoresheetKey(
      loresheetKey,
    )

    onChange({
      selections:
        value.selections.filter(
          (selection) =>
            !isCreationLoresheetSelection(
              selection,
            ),
        ),
    })
  }

  function toggleBenefit(
    loresheet:
      CharacterLoresheetDefinition,
    benefit:
      CharacterLoresheetDefinition['benefits'][number],
  ) {
    const current =
      selections.find(
        (selection) =>
          selection.details?.kind ===
            'loresheet' &&
          selection.details.loresheetKey ===
            loresheet.key &&
          selection.details.benefitKey ===
            benefit.key,
      )

    if (current) {
      onChange({
        selections:
          value.selections.filter(
            (selection) =>
              selection.selectionId !==
              current.selectionId,
          ),
      })
      return
    }

    const eligibility =
      validateCharacterLoresheetEligibility(
        loresheet,
        context,
      )

    if (!eligibility.eligible) {
      return
    }

    const selection:
      CharacterAdvantageSelectionDraft = {
        selectionId:
          createLoresheetSelectionId(
            loresheet.key,
            benefit.key,
          ),

        definitionKey:
          activeLoresheetDefinition.key,

        category:
          activeLoresheetDefinition.category,

        rating:
          benefit.level,

        origin:
          'creation',

        details: {
          kind: 'loresheet',
          loresheetKey:
            loresheet.key,
          benefitKey:
            benefit.key,
        },
      }

    onChange({
      selections: [
        ...value.selections,
        selection,
      ],
    })
  }

  return (
    <section className="advantages-category advantages-category--loresheet">
      <header className="advantages-category__heading">
        <div>
          <span>
            Catálogo CORE
          </span>

          <h3>
            Fichas de Conocimientos
          </h3>

          <p>
            Puedes adquirir varias Ventajas de una
            única Ficha. Cada Ventaja cuesta tantos
            puntos como su nivel y no exige comprar
            los niveles inferiores.
          </p>
        </div>

        <strong>
          {characterCoreLoresheetDefinitions.length}
        </strong>
      </header>

      <div className="advantage-instance-editor loresheet-selector-control">
        <span id="loresheet-selector-label">
          Ficha de Conocimientos
        </span>

        <details className="loresheet-selector-menu">
          <summary
            className="loresheet-selector-menu__trigger"
            aria-labelledby="loresheet-selector-label"
          >
            <span>
              {selectedLoresheet
                ? (
                    selectedLoresheet.name +
                    (
                      selectedLoresheet.sourcePage
                        ? ` · pág. ${selectedLoresheet.sourcePage}`
                        : ''
                    )
                  )
                : 'Selecciona una ficha'}
            </span>
          </summary>

          <div
            className="loresheet-selector-menu__options"
            role="listbox"
            aria-labelledby="loresheet-selector-label"
          >
            <button
              type="button"
              role="option"
              aria-selected={
                selectedLoresheetKey === ''
              }
              className={
                selectedLoresheetKey === ''
                  ? 'loresheet-selector-menu__option loresheet-selector-menu__option--selected'
                  : 'loresheet-selector-menu__option'
              }
              onClick={(event) => {
                changeLoresheet('')

                const menu =
                  event.currentTarget.closest(
                    'details',
                  )

                if (
                  menu instanceof
                  HTMLDetailsElement
                ) {
                  menu.open = false
                }
              }}
            >
              Selecciona una ficha
            </button>

            {characterCoreLoresheetDefinitions.map(
              (definition) => {
                const eligibility =
                  validateCharacterLoresheetEligibility(
                    definition,
                    context,
                  )

                const selected =
                  definition.key ===
                  selectedLoresheetKey

                return (
                  <button
                    key={definition.key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={
                      !eligibility.eligible &&
                      !selected
                    }
                    className={
                      selected
                        ? 'loresheet-selector-menu__option loresheet-selector-menu__option--selected'
                        : 'loresheet-selector-menu__option'
                    }
                    onClick={(event) => {
                      changeLoresheet(
                        definition.key,
                      )

                      const menu =
                        event.currentTarget.closest(
                          'details',
                        )

                      if (
                        menu instanceof
                        HTMLDetailsElement
                      ) {
                        menu.open = false
                      }
                    }}
                  >
                    <span>
                      {definition.name}
                      {definition.sourcePage
                        ? ` · pág. ${definition.sourcePage}`
                        : ''}
                    </span>

                    {!eligibility.eligible ? (
                      <small>
                        No disponible
                      </small>
                    ) : null}
                  </button>
                )
              },
            )}
          </div>
        </details>
      </div>

      {selectedEligibility &&
        !selectedEligibility.eligible && (
        <div
          className="creation-step-validation"
          role="alert"
        >
          {selectedEligibility.errors.map(
            (error) => (
              <p key={error}>
                {error}
              </p>
            ),
          )}
        </div>
      )}

      {selectedLoresheet && (
        <div className="advantages-catalog-grid advantages-catalog-grid--merit">
          {selectedLoresheet.benefits.map(
            (benefit) => {
              const selected =
                selections.some(
                  (selection) =>
                    selection.details?.kind ===
                      'loresheet' &&
                    selection.details.loresheetKey ===
                      selectedLoresheet.key &&
                    selection.details.benefitKey ===
                      benefit.key,
                )

              return (
                <article
                  key={
                    benefit.key
                  }
                  className={
                    selected
                      ? 'advantage-sheet-entry advantage-sheet-entry--selected'
                      : 'advantage-sheet-entry'
                  }
                >
                  <header>
                    <div>
                      <span>
                        Nivel {benefit.level}
                      </span>

                      <h4>
                        {benefit.name}
                      </h4>
                    </div>

                    <strong>
                      {'•'.repeat(
                        benefit.level,
                      )}
                    </strong>
                  </header>

                  <button
                    type="button"
                    aria-pressed={
                      selected
                    }
                    disabled={
                      selectedEligibility
                        ?.eligible === false &&
                      !selected
                    }
                    onClick={() =>
                      toggleBenefit(
                        selectedLoresheet,
                        benefit,
                      )
                    }
                  >
                    {selected
                      ? 'Quitar'
                      : 'Adquirir'}
                  </button>
                </article>
              )
            },
          )}
        </div>
      )}
    </section>
  )
}
