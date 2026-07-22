import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'
import type {
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types'

export interface CharacterAdvantageDefinitionValidationResult {
  valid: boolean
  errors: string[]
}

export function validateCharacterAdvantageDefinitions(
  definitions: readonly CharacterAdvantageDefinition[],
): CharacterAdvantageDefinitionValidationResult {
  const errors: string[] = []

  const keys =
    definitions.map(
      (definition) =>
        definition.key,
    )

  if (
    new Set(keys).size !==
    keys.length
  ) {
    errors.push(
      'Las definiciones de Ventajas, Trasfondos y Defectos deben tener claves únicas.',
    )
  }

  for (const definition of definitions) {
    if (!definition.key.trim()) {
      errors.push(
        'Toda definición debe tener una clave.',
      )
    }

    if (!definition.name.trim()) {
      errors.push(
        'Toda definición debe tener un nombre.',
      )
    }

    if (
      definition.allowedRatings.length === 0
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} debe permitir al menos una puntuación.`,
      )
    }

    if (
      definition.allowedRatings.some(
        (rating) =>
          !Number.isInteger(rating) ||
          rating < 1 ||
          rating > 5,
      )
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} contiene puntuaciones no válidas.`,
      )
    }

    if (
      new Set(
        definition.allowedRatings,
      ).size !==
      definition.allowedRatings.length
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} contiene puntuaciones duplicadas.`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}

export function validateCharacterAdvantageSelectionsAgainstDefinitions(
  draft: CharacterAdvantagesDraft,
  definitions: readonly CharacterAdvantageDefinition[],
): CharacterAdvantageDefinitionValidationResult {
  const errors: string[] = []

  const definitionsByKey =
    new Map(
      definitions.map(
        (definition) => [
          definition.key,
          definition,
        ],
      ),
    )

  const occurrences =
    new Map<string, number>()

  for (const selection of draft.selections) {
    const definition =
      definitionsByKey.get(
        selection.definitionKey,
      )

    if (!definition) {
      errors.push(
        `La selección ${selection.selectionId} referencia una definición inexistente: ${selection.definitionKey}.`,
      )

      continue
    }

    if (
      selection.category !==
      definition.category
    ) {
      errors.push(
        `La selección ${selection.selectionId} no coincide con la categoría de su definición.`,
      )
    }

    if (
      !definition.allowedRatings.includes(
        selection.rating,
      )
    ) {
      errors.push(
        `La puntuación ${selection.rating} no está permitida para ${definition.name}.`,
      )
    }

    occurrences.set(
      definition.key,
      (occurrences.get(
        definition.key,
      ) ?? 0) + 1,
    )
  }

  for (
    const [
      definitionKey,
      count,
    ] of occurrences
  ) {
    const definition =
      definitionsByKey.get(
        definitionKey,
      )

    if (
      definition &&
      !definition.allowMultiple &&
      count > 1
    ) {
      errors.push(
        `${definition.name} no admite múltiples instancias.`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}
