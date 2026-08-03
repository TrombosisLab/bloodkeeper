import type {
  CharacterRulesAdvantageCatalog,
  CharacterRulesAdvantageDefinition,
  CharacterRulesAdvantageSelectionOrigin,
} from '@v5r/character-rules'

import {
  characterRulesCatalog,
} from './character-rules-catalog'

import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'

import type {
  PersistedCharacterAdvantageSelection,
  PersistedCharacterDraft,
} from './persisted-character.types'

import type {
  CharacterValidationContributor,
} from './character-validator'

import type {
  CharacterSectionValidation,
  CharacterValidationContext,
  CharacterValidationIssue,
  CharacterValidationSeverity,
} from './character-validation.types'

interface AdvantageCatalogIndex {
  readonly definitions: ReadonlyMap<
    string,
    CharacterRulesAdvantageDefinition
  >
}

function issue(
  code: string,
  severity: CharacterValidationSeverity,
  field: string | null,
  message: string,
  details?: Readonly<
    Record<string, string | number | boolean | null>
  >,
): CharacterValidationIssue {
  return {
    code,
    severity,
    section: 'advantages',
    field,
    message,
    details,
  }
}

function errorIssue(
  code: string,
  field: string | null,
  message: string,
  details?: Readonly<
    Record<string, string | number | boolean | null>
  >,
): CharacterValidationIssue {
  return issue(
    code,
    'error',
    field,
    message,
    details,
  )
}

function duplicateValues(
  values: readonly string[],
): string[] {
  const seen = new Set<string>()
  const duplicated = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) duplicated.add(value)
    seen.add(value)
  }

  return [...duplicated]
}

function sectionResult(
  issues: readonly CharacterValidationIssue[],
): CharacterSectionValidation {
  if (
    issues.some(
      ({ severity }) => severity === 'error',
    )
  ) {
    return {
      section: 'advantages',
      state: 'invalid',
      issues,
    }
  }

  if (issues.length > 0) {
    return {
      section: 'advantages',
      state: 'pending',
      issues,
    }
  }

  return {
    section: 'advantages',
    state: 'complete',
    issues: [],
  }
}

function completionSeverity(
  context: CharacterValidationContext,
): CharacterValidationSeverity {
  return context === 'draftSave'
    ? 'warning'
    : 'error'
}

function validatesCreationBudget(
  context: CharacterValidationContext,
): boolean {
  return (
    context === 'draftSave' ||
    context === 'activation'
  )
}

function buildCatalogIndex(
  catalog: CharacterRulesAdvantageCatalog,
): AdvantageCatalogIndex {
  const definitions = new Map<
    string,
    CharacterRulesAdvantageDefinition
  >()

  for (const definition of catalog.definitions) {
    if (definitions.has(definition.key)) {
      throw new Error(
        `Duplicate advantage definition: ${definition.key}`,
      )
    }

    definitions.set(definition.key, definition)
  }

  return Object.freeze({ definitions })
}

function validateStructure(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []

  for (const selectionId of duplicateValues(
    selections.map(
      (selection) => selection.selectionId,
    ),
  )) {
    issues.push(
      errorIssue(
        'CHARACTER_ADVANTAGE_SELECTION_ID_DUPLICATE',
        'advantages',
        'Las selecciones deben tener identificadores unicos.',
        { selectionId },
      ),
    )
  }

  for (const selection of selections) {
    if (selection.selectionId.trim().length === 0) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_SELECTION_ID_REQUIRED',
          'advantages',
          'Toda seleccion necesita un identificador.',
        ),
      )
    }

    if (selection.definitionKey.trim().length === 0) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_DEFINITION_KEY_REQUIRED',
          'advantages',
          'Toda seleccion debe referenciar una definicion.',
          { selectionId: selection.selectionId },
        ),
      )
    }

    if (
      !Number.isInteger(selection.rating) ||
      selection.rating < 1 ||
      selection.rating > 7
    ) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_RATING_OUT_OF_RANGE',
          'advantages',
          'La puntuacion debe ser un entero entre 1 y 7.',
          {
            selectionId: selection.selectionId,
            rating: selection.rating,
          },
        ),
      )
    }
  }

  return issues
}

function validateParentRelations(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const byId = new Map(
    selections.map(
      (selection) => [
        selection.selectionId,
        selection,
      ] as const,
    ),
  )

  for (const selection of selections) {
    const parentId = selection.parentSelectionId

    if (parentId === null) continue

    if (parentId === selection.selectionId) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_SELF_PARENT',
          'advantages',
          'Una seleccion no puede ser su propio padre.',
          { selectionId: selection.selectionId },
        ),
      )
      continue
    }

    if (!byId.has(parentId)) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_PARENT_NOT_FOUND',
          'advantages',
          'La seleccion padre no existe.',
          {
            selectionId: selection.selectionId,
            parentSelectionId: parentId,
          },
        ),
      )
      continue
    }

    const visited = new Set([
      selection.selectionId,
    ])
    let candidateId: string | null = parentId

    while (candidateId !== null) {
      if (visited.has(candidateId)) {
        issues.push(
          errorIssue(
            'CHARACTER_ADVANTAGE_PARENT_CYCLE',
            'advantages',
            'Las relaciones padre no pueden formar ciclos.',
            { selectionId: selection.selectionId },
          ),
        )
        break
      }

      visited.add(candidateId)
      candidateId =
        byId.get(candidateId)
          ?.parentSelectionId ?? null
    }
  }

  return issues
}

function validateDetails(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []

  for (const selection of selections) {
    const details = selection.details
    if (details === null) continue

    const detailsIssue = (
      code: string,
      message: string,
    ): void => {
      issues.push(
        errorIssue(
          code,
          'advantages',
          message,
          { selectionId: selection.selectionId },
        ),
      )
    }

    switch (details.kind) {
      case 'allies':
        if (
          !Number.isInteger(details.effectiveness) ||
          details.effectiveness < 1 ||
          details.effectiveness > 4 ||
          !Number.isInteger(details.reliability) ||
          details.reliability < 1 ||
          details.reliability > 3 ||
          details.effectiveness +
              details.reliability !==
            selection.rating
        ) {
          detailsIssue(
            'CHARACTER_ALLIES_DETAILS_INVALID',
            'Aliados requiere Efectividad, Fiabilidad y puntuacion coherentes.',
          )
        }
        break
      case 'mask':
        if (
          duplicateValues(details.benefits).length > 0
        ) {
          detailsIssue(
            'CHARACTER_MASK_BENEFIT_DUPLICATE',
            'Los beneficios de Mascara no pueden repetirse.',
          )
        }
        break
      case 'linguistics':
        if (
          details.languages.some(
            (language) =>
              language.trim().length === 0,
          ) ||
          duplicateValues(
            details.languages.map((language) =>
              language.trim().toLocaleLowerCase(),
            ),
          ).length > 0
        ) {
          detailsIssue(
            'CHARACTER_LINGUISTICS_DETAILS_INVALID',
            'Los idiomas deben ser unicos y no pueden estar vacios.',
          )
        }
        break
      case 'folkloricBane':
        if (details.source.trim().length === 0) {
          detailsIssue(
            'CHARACTER_FOLKLORIC_BANE_SOURCE_REQUIRED',
            'El Defecto folclorico necesita una fuente.',
          )
        }
        break
      case 'folkloricBlock':
        if (details.taboo.trim().length === 0) {
          detailsIssue(
            'CHARACTER_FOLKLORIC_BLOCK_TABOO_REQUIRED',
            'El Bloqueo folclorico necesita un tabu.',
          )
        }
        break
      case 'preyExclusion':
        if (details.excludedPrey.trim().length === 0) {
          detailsIssue(
            'CHARACTER_PREY_EXCLUSION_REQUIRED',
            'La exclusion de presa debe estar definida.',
          )
        }
        break
      case 'substanceUse':
        if (details.substance.trim().length === 0) {
          detailsIssue(
            'CHARACTER_SUBSTANCE_REQUIRED',
            'El consumo de sustancia debe identificarla.',
          )
        }
        break
      case 'loresheet':
        if (
          details.loresheetKey.trim().length === 0 ||
          details.benefitKey.trim().length === 0
        ) {
          detailsIssue(
            'CHARACTER_LORESHEET_REFERENCE_REQUIRED',
            'La Ficha de Conocimientos necesita referencias completas.',
          )
        }
        break
      default:
        break
    }
  }

  return issues
}

function allowedRatingsFor(
  definition: CharacterRulesAdvantageDefinition,
  origin: CharacterRulesAdvantageSelectionOrigin,
): readonly number[] {
  return (
    definition.originRatingConstraints?.find(
      (constraint) => constraint.origin === origin,
    )?.allowedRatings ?? definition.allowedRatings
  )
}

function validateCatalogSelections(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
  context: CharacterValidationContext,
  index: AdvantageCatalogIndex,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const bySelectionId = new Map(
    selections.map(
      (selection) => [
        selection.selectionId,
        selection,
      ] as const,
    ),
  )
  const byDefinitionKey = new Map<
    string,
    PersistedCharacterAdvantageSelection[]
  >()

  for (const selection of selections) {
    const definition = index.definitions.get(
      selection.definitionKey,
    )

    if (definition === undefined) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_DEFINITION_UNKNOWN',
          'advantages',
          'La seleccion referencia una Ventaja inexistente.',
          {
            selectionId: selection.selectionId,
            definitionKey: selection.definitionKey,
          },
        ),
      )
      continue
    }

    const selected =
      byDefinitionKey.get(definition.key) ?? []
    selected.push(selection)
    byDefinitionKey.set(definition.key, selected)

    if (!definition.active) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_DEFINITION_INACTIVE',
          'advantages',
          'La Ventaja seleccionada no esta activa.',
          {
            selectionId: selection.selectionId,
            definitionKey: definition.key,
          },
        ),
      )
    }

    if (selection.category !== definition.category) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_CATEGORY_MISMATCH',
          'advantages',
          'La categoria persistida no coincide con el catalogo.',
          {
            selectionId: selection.selectionId,
            definitionKey: definition.key,
          },
        ),
      )
    }

    if (
      !allowedRatingsFor(
        definition,
        selection.origin,
      ).includes(selection.rating)
    ) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_RATING_NOT_ALLOWED',
          'advantages',
          'La puntuacion no esta permitida para esta Ventaja y origen.',
          {
            selectionId: selection.selectionId,
            definitionKey: definition.key,
            rating: selection.rating,
            origin: selection.origin,
          },
        ),
      )
    }

    if (
      definition.requiresInstanceDetails &&
      selection.details === null
    ) {
      issues.push(
        issue(
          'CHARACTER_ADVANTAGE_DETAILS_REQUIRED',
          completionSeverity(context),
          'advantages',
          'La Ventaja necesita datos propios de la instancia.',
          {
            selectionId: selection.selectionId,
            definitionKey: definition.key,
          },
        ),
      )
    }

    if (selection.details !== null) {
      if (definition.instanceDetailsKind === undefined) {
        issues.push(
          errorIssue(
            'CHARACTER_ADVANTAGE_DETAILS_NOT_ALLOWED',
            'advantages',
            'La definicion no admite datos de instancia.',
            {
              selectionId: selection.selectionId,
              definitionKey: definition.key,
            },
          ),
        )
      } else if (
        selection.details.kind !==
        definition.instanceDetailsKind
      ) {
        issues.push(
          errorIssue(
            'CHARACTER_ADVANTAGE_DETAILS_KIND_MISMATCH',
            'advantages',
            'El tipo de datos no coincide con la definicion.',
            {
              selectionId: selection.selectionId,
              definitionKey: definition.key,
              expectedKind:
                definition.instanceDetailsKind,
              actualKind: selection.details.kind,
            },
          ),
        )
      }
    }

    const parentId = selection.parentSelectionId

    if (
      definition.requiresParentSelection === true &&
      parentId === null
    ) {
      issues.push(
        issue(
          'CHARACTER_ADVANTAGE_CATALOG_PARENT_REQUIRED',
          completionSeverity(context),
          'advantages',
          'La Ventaja necesita una seleccion padre compatible.',
          {
            selectionId: selection.selectionId,
            definitionKey: definition.key,
          },
        ),
      )
    }

    if (parentId !== null) {
      const parent = bySelectionId.get(parentId)
      const parentAllowed =
        definition.requiresParentSelection === true ||
        definition.allowsOptionalParentSelection === true

      if (!parentAllowed) {
        issues.push(
          errorIssue(
            'CHARACTER_ADVANTAGE_CATALOG_PARENT_NOT_ALLOWED',
            'advantages',
            'La definicion no admite una seleccion padre.',
            {
              selectionId: selection.selectionId,
              definitionKey: definition.key,
            },
          ),
        )
      } else if (parent !== undefined) {
        if (
          !(
            definition.allowedParentDefinitionKeys ?? []
          ).includes(parent.definitionKey)
        ) {
          issues.push(
            errorIssue(
              'CHARACTER_ADVANTAGE_PARENT_DEFINITION_NOT_ALLOWED',
              'advantages',
              'La seleccion padre no pertenece a una definicion permitida.',
              {
                selectionId: selection.selectionId,
                parentSelectionId: parentId,
                parentDefinitionKey:
                  parent.definitionKey,
              },
            ),
          )
        }

        if (
          definition.minimumParentRating !== undefined &&
          parent.rating < definition.minimumParentRating
        ) {
          issues.push(
            errorIssue(
              'CHARACTER_ADVANTAGE_PARENT_RATING_TOO_LOW',
              'advantages',
              'La puntuacion de la seleccion padre es insuficiente.',
              {
                selectionId: selection.selectionId,
                parentSelectionId: parentId,
                parentRating: parent.rating,
                minimumParentRating:
                  definition.minimumParentRating,
              },
            ),
          )
        }

        const parentConstraint =
          definition.parentRatingConstraints?.find(
            (constraint) =>
              constraint.parentRating === parent.rating,
          )

        if (
          parentConstraint !== undefined &&
          !parentConstraint.allowedRatings.includes(
            selection.rating,
          )
        ) {
          issues.push(
            errorIssue(
              'CHARACTER_ADVANTAGE_PARENT_RATING_CONSTRAINT_VIOLATED',
              'advantages',
              'La puntuacion no esta permitida para el nivel del padre.',
              {
                selectionId: selection.selectionId,
                parentSelectionId: parentId,
                parentRating: parent.rating,
                rating: selection.rating,
              },
            ),
          )
        }
      }
    }
  }

  for (const [definitionKey, selected] of byDefinitionKey) {
    const definition = index.definitions.get(definitionKey)

    if (
      definition !== undefined &&
      !definition.allowMultiple &&
      selected.length > 1
    ) {
      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_MULTIPLE_NOT_ALLOWED',
          'advantages',
          'La Ventaja no admite multiples instancias.',
          {
            definitionKey,
            selectionCount: selected.length,
          },
        ),
      )
    }
  }

  const selectedDefinitionKeys = new Set(
    selections.map(
      (selection) => selection.definitionKey,
    ),
  )
  const incompatiblePairs = new Set<string>()

  for (const selection of selections) {
    const definition = index.definitions.get(
      selection.definitionKey,
    )

    if (definition === undefined) continue

    for (
      const incompatibleKey of
        definition.incompatibleDefinitionKeys ?? []
    ) {
      if (!selectedDefinitionKeys.has(incompatibleKey)) {
        continue
      }

      const pair = [
        definition.key,
        incompatibleKey,
      ].sort().join('|')

      if (incompatiblePairs.has(pair)) continue
      incompatiblePairs.add(pair)

      issues.push(
        errorIssue(
          'CHARACTER_ADVANTAGE_INCOMPATIBLE_SELECTIONS',
          'advantages',
          'El personaje contiene Ventajas incompatibles.',
          {
            definitionKey: definition.key,
            incompatibleDefinitionKey:
              incompatibleKey,
          },
        ),
      )
    }
  }

  return issues
}

function validateCreationBudget(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
  context: CharacterValidationContext,
): CharacterValidationIssue[] {
  if (!validatesCreationBudget(context)) return []

  let advantagePoints = 0
  let flawPoints = 0

  for (const selection of selections) {
    if (selection.origin !== 'creation') continue

    if (
      selection.category === 'merit' ||
      selection.category === 'background'
    ) {
      advantagePoints += selection.rating

      if (selection.details?.kind === 'mask') {
        advantagePoints +=
          selection.details.benefits.length
      }
    } else {
      flawPoints += selection.rating
    }
  }

  const severity = completionSeverity(context)
  const issues: CharacterValidationIssue[] = []

  if (advantagePoints !== 7) {
    issues.push(
      issue(
        'CHARACTER_ADVANTAGE_CREATION_BUDGET_INVALID',
        severity,
        'advantages',
        'La creacion requiere exactamente 7 puntos de Meritos y Trasfondos.',
        { advantagePoints },
      ),
    )
  }

  if (flawPoints !== 2) {
    issues.push(
      issue(
        'CHARACTER_FLAW_CREATION_BUDGET_INVALID',
        severity,
        'advantages',
        'La creacion requiere exactamente 2 puntos de Defectos.',
        { flawPoints },
      ),
    )
  }

  return issues
}

function validatePersistedAdvantageState(
  character: PersistedCharacterDraft,
  context: CharacterValidationContext,
  catalog: CharacterRulesCatalog,
  index: AdvantageCatalogIndex,
): CharacterSectionValidation {
  const selections = character.advantages.selections
  const structuralIssues = [
    ...validateStructure(selections),
    ...validateParentRelations(selections),
    ...validateDetails(selections),
  ]

  if (structuralIssues.length > 0) {
    return sectionResult(structuralIssues)
  }

  if (catalog.stateOf('advantages') !== 'ready') {
    return {
      section: 'advantages',
      state: 'pending',
      issues: [
        issue(
          'CHARACTER_ADVANTAGE_CATALOG_VALIDATION_PENDING',
          'warning',
          null,
          'Falta contrastar Ventajas con el catalogo canonico del backend.',
        ),
      ],
    }
  }

  return sectionResult([
    ...validateCatalogSelections(
      selections,
      context,
      index,
    ),
    ...validateCreationBudget(selections, context),
  ])
}

export function createCharacterAdvantageValidationContributor(
  catalog: CharacterRulesCatalog,
): CharacterValidationContributor {
  const index = buildCatalogIndex(
    catalog.advantageCatalog,
  )

  return Object.freeze({
    sections: ['advantages'] as const,

    validate(
      character: PersistedCharacterDraft,
      context: CharacterValidationContext,
    ) {
      return [
        validatePersistedAdvantageState(
          character,
          context,
          catalog,
          index,
        ),
      ]
    },
  })
}

export const characterAdvantageValidationContributor =
  createCharacterAdvantageValidationContributor(
    characterRulesCatalog,
  )
