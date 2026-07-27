import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

import type {
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types'

import {
  validateAdvantageParentRelations,
} from './advantage-parent-rules.ts'


export interface AdvantageRelationValidationResult {
  valid: boolean
  errors: string[]
}


export function validateAdvantageRelations(
  draft: CharacterAdvantagesDraft,
  definitions: readonly CharacterAdvantageDefinition[],
): AdvantageRelationValidationResult {

  return validateAdvantageParentRelations(
    draft,
    definitions,
  )
}
