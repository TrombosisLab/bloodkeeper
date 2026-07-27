import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

import type {
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types'


export interface AdvantageParentValidationResult {
  valid: boolean
  errors: string[]
}


export function validateAdvantageParentRelations(
  draft: CharacterAdvantagesDraft,
  definitions: readonly CharacterAdvantageDefinition[],
): AdvantageParentValidationResult {

  const errors: string[] = []

  for (const selection of draft.selections) {

    const definition =
      definitions.find(
        (item) =>
          item.key ===
          selection.definitionKey,
      )

    if (!definition) {
      continue
    }


    if (
      definition.requiresParentSelection !== true
    ) {
      continue
    }


    if (
      !selection.parentSelectionId
    ) {
      errors.push(
        `${definition.name} necesita una selección padre.`,
      )

      continue
    }


    const parent =
      draft.selections.find(
        (candidate) =>
          candidate.selectionId ===
          selection.parentSelectionId,
      )


    if (!parent) {
      errors.push(
        `${definition.name} tiene un padre inexistente.`,
      )

      continue
    }


    if (
      definition.allowedParentDefinitionKeys &&
      !definition.allowedParentDefinitionKeys.includes(
        parent.definitionKey,
      )
    ) {
      errors.push(
        `${definition.name} no puede depender de ${parent.definitionKey}.`,
      )
    }


    if (
      definition.minimumParentRating &&
      parent.rating <
        definition.minimumParentRating
    ) {
      errors.push(
        `${definition.name} requiere un padre con puntuación mínima ${definition.minimumParentRating}.`,
      )
    }


    if (
      definition.parentRatingConstraints
    ) {
      const constraint =
        definition.parentRatingConstraints.find(
          (item) =>
            item.parentRating ===
            parent.rating,
        )

      if (
        constraint &&
        !constraint.allowedRatings.includes(
          selection.rating,
        )
      ) {
        errors.push(
          `${definition.name} no permite esa puntuación con un padre de nivel ${parent.rating}.`,
        )
      }
    }
  }


  return {
    valid:
      errors.length === 0,

    errors: [
      ...new Set(errors),
    ],
  }
}
