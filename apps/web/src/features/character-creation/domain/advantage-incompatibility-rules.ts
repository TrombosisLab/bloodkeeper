import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types.ts'
import type {
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types.ts'

export interface CharacterAdvantageIncompatibilityValidationResult {
  valid: boolean
  errors: string[]
}

/*
 * Evalúa las incompatibilidades declaradas por el catálogo.
 *
 * Una sola definición puede declarar la relación: la validación
 * la trata como bidireccional para que el orden de selección no
 * altere el resultado. Las parejas se notifican una única vez.
 */
export function validateCharacterAdvantageIncompatibilities(
  draft: CharacterAdvantagesDraft,
  definitions: readonly CharacterAdvantageDefinition[],
): CharacterAdvantageIncompatibilityValidationResult {
  const definitionsByKey =
    new Map(
      definitions.map(
        (definition) => [
          definition.key,
          definition,
        ],
      ),
    )

  const selectedDefinitionKeys =
    new Set(
      draft.selections.map(
        (selection) =>
          selection.definitionKey,
      ),
    )

  const reportedPairs =
    new Set<string>()

  const errors: string[] = []

  for (
    const selectedDefinitionKey of
    selectedDefinitionKeys
  ) {
    const definition =
      definitionsByKey.get(
        selectedDefinitionKey,
      )

    if (!definition) {
      continue
    }

    for (
      const incompatibleDefinitionKey of
      definition.incompatibleDefinitionKeys ?? []
    ) {
      if (
        !selectedDefinitionKeys.has(
          incompatibleDefinitionKey,
        )
      ) {
        continue
      }

      const pairKey = [
        definition.key,
        incompatibleDefinitionKey,
      ].sort().join('::')

      if (
        reportedPairs.has(
          pairKey,
        )
      ) {
        continue
      }

      reportedPairs.add(pairKey)

      const incompatibleDefinition =
        definitionsByKey.get(
          incompatibleDefinitionKey,
        )

      errors.push(
        `${definition.name} es incompatible con ${incompatibleDefinition?.name ?? incompatibleDefinitionKey}.`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
