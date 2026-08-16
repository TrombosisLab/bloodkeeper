import {
  characterMortalAdvantageExclusionCatalog,
} from '@v5r/character-rules'

import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

import type {
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types'

import type {
  CharacterDraftApiCreationMode,
} from '../types/character-draft-api.types'

import type {
  CharacterDraft,
} from '../types/character-draft.types'

const mortalExclusionKeys =
  new Set<string>(
    Object.values(
      characterMortalAdvantageExclusionCatalog,
    ).flatMap(
      keys => [...keys],
    ),
  )

const vampireRequirementTypes =
  new Set([
    'clan',
    'predatorType',
    'thinBlood',
    'generation',
  ])

export function isSessionZeroCreationMode(
  creationMode: CharacterDraftApiCreationMode,
): boolean {
  return creationMode === 'sessionZero'
}

export function prepareDraftForCreationMode(
  draft: CharacterDraft,
  creationMode: CharacterDraftApiCreationMode,
): CharacterDraft {
  const prepared = structuredClone(draft)

  if (!isSessionZeroCreationMode(creationMode)) {
    return prepared
  }

  return {
    ...prepared,
    identity: {
      ...prepared.identity,
      predatorType: '',
      clan: null,
      sire: '',
      generation: null,
      ageCategory: null,
    },
    predatorTypeChoices: {},
    disciplines: [],
    bloodSorceryRituals: {
      ritualKeys: [],
    },
    oblivionCeremonies: {
      ceremonyKeys: [],
    },
    thinBloodAlchemy: {
      rating: 0,
      method: null,
      formulaKeys: [],
    },
    thinBloodTraits: {
      selections: [],
    },
  }
}

export function isHumanAdvantageDefinitionAllowed(
  definition: CharacterAdvantageDefinition,
): boolean {
  if (
    mortalExclusionKeys.has(
      definition.key,
    )
  ) {
    return false
  }

  if (
    definition.requirements?.clanKeys &&
    definition.requirements.clanKeys.length > 0
  ) {
    return false
  }

  if (
    definition.requirementRules?.some(
      requirement =>
        vampireRequirementTypes.has(
          requirement.type,
        ),
    )
  ) {
    return false
  }

  return true
}

export function validateHumanAdvantageSelections(
  value: CharacterAdvantagesDraft,
  definitions:
    readonly CharacterAdvantageDefinition[],
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  for (const selection of value.selections) {
    if (selection.origin !== 'creation') {
      errors.push(
        `La Ventaja ${selection.definitionKey} tiene un origen no aplicable a un humano.`,
      )
      continue
    }

    const definition =
      definitions.find(
        candidate =>
          candidate.key ===
          selection.definitionKey,
      )

    if (definition === undefined) {
      errors.push(
        `La Ventaja ${selection.definitionKey} no existe en el catálogo activo.`,
      )
      continue
    }

    if (
      !isHumanAdvantageDefinitionAllowed(
        definition,
      )
    ) {
      errors.push(
        `La Ventaja ${selection.definitionKey} no es válida durante la fase humana.`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
  }
}
