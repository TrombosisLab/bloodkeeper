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
} from './character-validation.types'

function issue(
  code: string,
  field: string | null,
  message: string,
  details?: Readonly<
    Record<string, string | number | boolean | null>
  >,
): CharacterValidationIssue {
  return {
    code,
    severity: 'error',
    section: 'advantages',
    field,
    message,
    details,
  }
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
      issue(
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
        issue(
          'CHARACTER_ADVANTAGE_SELECTION_ID_REQUIRED',
          'advantages',
          'Toda seleccion necesita un identificador.',
        ),
      )
    }

    if (selection.definitionKey.trim().length === 0) {
      issues.push(
        issue(
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
        issue(
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
        issue(
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
        issue(
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
          issue(
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
        issue(
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

function validateCreationBudget(
  selections:
    readonly PersistedCharacterAdvantageSelection[],
  context: CharacterValidationContext,
): CharacterValidationIssue[] {
  if (context !== 'activation') return []

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

  const issues: CharacterValidationIssue[] = []

  if (advantagePoints !== 7) {
    issues.push(
      issue(
        'CHARACTER_ADVANTAGE_CREATION_BUDGET_INVALID',
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
): CharacterSectionValidation {
  const selections =
    character.advantages.selections
  const issues = [
    ...validateStructure(selections),
    ...validateParentRelations(selections),
    ...validateDetails(selections),
    ...validateCreationBudget(selections, context),
  ]

  if (issues.length > 0) {
    return {
      section: 'advantages',
      state: 'invalid',
      issues,
    }
  }

  return {
    section: 'advantages',
    state: 'pending',
    issues: [
      {
        code:
          'CHARACTER_ADVANTAGE_CATALOG_VALIDATION_PENDING',
        severity: 'warning',
        section: 'advantages',
        field: null,
        message:
          'Falta contrastar requisitos e incompatibilidades con el catalogo canonico del backend.',
      },
    ],
  }
}

export const characterAdvantageValidationContributor:
  CharacterValidationContributor = {
  sections: ['advantages'],

  validate(character, context) {
    return [
      validatePersistedAdvantageState(
        character,
        context,
      ),
    ]
  },
}
