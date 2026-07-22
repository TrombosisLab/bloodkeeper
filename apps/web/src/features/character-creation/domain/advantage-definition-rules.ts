import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'
import type {
  CharacterAdvantageSelectionDraft,
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

  const knownKeys =
    new Set(keys)

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
          rating > 6,
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

    if (
      definition.requiresInstanceDetails &&
      !definition.instanceDetailsKind
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} requiere datos de instancia pero no declara su tipo.`,
      )
    }

    if (
      !definition.requiresInstanceDetails &&
      definition.instanceDetailsKind
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} declara datos de instancia que no requiere.`,
      )
    }

    if (
      definition.requiresParentSelection &&
      (
        !definition.allowedParentDefinitionKeys ||
        definition.allowedParentDefinitionKeys.length === 0
      )
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} requiere una selección padre pero no declara padres permitidos.`,
      )
    }

    for (
      const parentKey of
        definition.allowedParentDefinitionKeys ?? []
    ) {
      if (!knownKeys.has(parentKey)) {
        errors.push(
          `La definición ${definition.key || '(sin clave)'} referencia un padre inexistente: ${parentKey}.`,
        )
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}

function validateInstanceDetails(
  selection: CharacterAdvantageSelectionDraft,
  definition: CharacterAdvantageDefinition,
  errors: string[],
): void {
  if (
    definition.requiresInstanceDetails &&
    !selection.details
  ) {
    errors.push(
      `La selección ${selection.selectionId} requiere datos específicos de instancia.`,
    )

    return
  }

  if (
    selection.details &&
    definition.instanceDetailsKind &&
    selection.details.kind !==
      definition.instanceDetailsKind
  ) {
    errors.push(
      `La selección ${selection.selectionId} usa un tipo de datos de instancia incompatible con su definición.`,
    )
  }

  if (
    selection.details?.kind === 'allies'
  ) {
    const {
      effectiveness,
      reliability,
    } = selection.details

    if (
      !Number.isInteger(effectiveness) ||
      effectiveness < 1 ||
      effectiveness > 4
    ) {
      errors.push(
        `La selección ${selection.selectionId} contiene una Efectividad de Aliados no válida.`,
      )
    }

    if (
      !Number.isInteger(reliability) ||
      reliability < 1 ||
      reliability > 3
    ) {
      errors.push(
        `La selección ${selection.selectionId} contiene una Fiabilidad de Aliados no válida.`,
      )
    }

    const total =
      effectiveness + reliability

    if (
      total !==
      selection.rating
    ) {
      errors.push(
        `La puntuación de ${selection.selectionId} debe coincidir con Efectividad + Fiabilidad.`,
      )
    }

    if (total > 6) {
      errors.push(
        `La puntuación total de Aliados no puede superar 6.`,
      )
    }
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

  const selectionsById =
    new Map(
      draft.selections.map(
        (selection) => [
          selection.selectionId,
          selection,
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

    validateInstanceDetails(
      selection,
      definition,
      errors,
    )

    if (
      definition.requiresParentSelection &&
      !selection.parentSelectionId
    ) {
      errors.push(
        `La selección ${selection.selectionId} requiere una selección padre.`,
      )
    }

    if (selection.parentSelectionId) {
      if (
        selection.parentSelectionId ===
        selection.selectionId
      ) {
        errors.push(
          `La selección ${selection.selectionId} no puede ser su propio padre.`,
        )
      }

      const parent =
        selectionsById.get(
          selection.parentSelectionId,
        )

      if (!parent) {
        errors.push(
          `La selección ${selection.selectionId} referencia una selección padre inexistente.`,
        )
      } else if (
        definition.allowedParentDefinitionKeys &&
        !definition.allowedParentDefinitionKeys.includes(
          parent.definitionKey,
        )
      ) {
        errors.push(
          `La selección ${selection.selectionId} está vinculada a un tipo de padre no permitido.`,
        )
      }
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
