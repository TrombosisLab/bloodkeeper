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


    const originRatingConstraints =
      definition.originRatingConstraints ?? []

    const constrainedOrigins =
      originRatingConstraints.map(
        (constraint) => constraint.origin,
      )

    if (
      new Set(constrainedOrigins).size !==
      constrainedOrigins.length
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} contiene restricciones de puntuación duplicadas para el mismo origen.`,
      )
    }

    for (
      const constraint of
      originRatingConstraints
    ) {
      if (
        constraint.allowedRatings.length === 0
      ) {
        errors.push(
          `La definición ${definition.key || '(sin clave)'} contiene una restricción de origen sin puntuaciones permitidas.`,
        )

        continue
      }

      if (
        constraint.allowedRatings.some(
          (rating) =>
            !Number.isInteger(rating) ||
            rating < 1,
        )
      ) {
        errors.push(
          `La definición ${definition.key || '(sin clave)'} contiene una puntuación de origen no válida.`,
        )
      }

      if (
        new Set(
          constraint.allowedRatings,
        ).size !==
        constraint.allowedRatings.length
      ) {
        errors.push(
          `La definición ${definition.key || '(sin clave)'} contiene puntuaciones de origen duplicadas.`,
        )
      }
    }

    const legacyRequirements =
      definition.requirements

    if (legacyRequirements) {
      const characterKinds =
        legacyRequirements.characterKinds ?? []
      const clanKeys =
        legacyRequirements.clanKeys ?? []
      const excludedClanKeys =
        legacyRequirements.excludedClanKeys ?? []
      const requiredDefinitionKeys =
        legacyRequirements.requiredDefinitionKeys ?? []

      if (
        new Set(characterKinds).size !==
        characterKinds.length
      ) {
        errors.push(
          `La definición ${definition.key || '(sin clave)'} contiene tipos de personaje requeridos duplicados.`,
        )
      }

      if (
        new Set(clanKeys).size !==
        clanKeys.length
      ) {
        errors.push(
          `La definición ${definition.key || '(sin clave)'} contiene clanes requeridos duplicados.`,
        )
      }

      if (
        new Set(excludedClanKeys).size !==
        excludedClanKeys.length
      ) {
        errors.push(
          `La definición ${definition.key || '(sin clave)'} contiene clanes excluidos duplicados.`,
        )
      }

      if (
        new Set(requiredDefinitionKeys).size !==
        requiredDefinitionKeys.length
      ) {
        errors.push(
          `La definición ${definition.key || '(sin clave)'} contiene definiciones requeridas duplicadas.`,
        )
      }

      for (
        const requiredKey of
        requiredDefinitionKeys
      ) {
        if (!knownKeys.has(requiredKey)) {
          errors.push(
            `La definición ${definition.key || '(sin clave)'} requiere una definición inexistente: ${requiredKey}.`,
          )
        }

        if (requiredKey === definition.key) {
          errors.push(
            `La definición ${definition.key || '(sin clave)'} no puede requerirse a sí misma.`,
          )
        }
      }

      for (const clanKey of clanKeys) {
        if (
          excludedClanKeys.includes(
            clanKey,
          )
        ) {
          errors.push(
            `La definición ${definition.key || '(sin clave)'} incluye y excluye simultáneamente el clan ${clanKey}.`,
          )
        }
      }
    }

    const requirementRules =
      definition.requirementRules ?? []

    const serializedRequirementRules =
      requirementRules.map(
        (requirement) =>
          JSON.stringify(requirement),
      )

    if (
      new Set(
        serializedRequirementRules,
      ).size !==
      serializedRequirementRules.length
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} contiene reglas de requisito duplicadas.`,
      )
    }

    for (
      const requirement of
      requirementRules
    ) {
      switch (requirement.type) {
        case 'advantage':
          if (
            !requirement.definitionKey.trim()
          ) {
            errors.push(
              `La definición ${definition.key || '(sin clave)'} contiene un requisito de Ventaja sin clave.`,
            )
          } else {
            if (
              !knownKeys.has(
                requirement.definitionKey,
              )
            ) {
              errors.push(
                `La definición ${definition.key || '(sin clave)'} requiere una definición inexistente: ${requirement.definitionKey}.`,
              )
            }

            if (
              requirement.definitionKey ===
              definition.key
            ) {
              errors.push(
                `La definición ${definition.key || '(sin clave)'} no puede requerirse a sí misma.`,
              )
            }
          }

          if (
            requirement.minRating !== undefined &&
            (
              !Number.isInteger(
                requirement.minRating,
              ) ||
              requirement.minRating < 1 ||
              requirement.minRating > 6
            )
          ) {
            errors.push(
              `La definición ${definition.key || '(sin clave)'} contiene un rating mínimo de requisito no válido.`,
            )
          }

          break

        case 'clan':
          if (
            requirement.allowedClanKeys.length === 0
          ) {
            errors.push(
              `La definición ${definition.key || '(sin clave)'} contiene un requisito de clan vacío.`,
            )
          }

          if (
            new Set(
              requirement.allowedClanKeys,
            ).size !==
            requirement.allowedClanKeys.length
          ) {
            errors.push(
              `La definición ${definition.key || '(sin clave)'} contiene clanes permitidos duplicados en una regla moderna.`,
            )
          }

          break

        case 'predatorType':
          if (
            requirement.allowedPredatorTypeKeys.length === 0
          ) {
            errors.push(
              `La definición ${definition.key || '(sin clave)'} contiene un requisito de tipo de depredador vacío.`,
            )
          }

          if (
            new Set(
              requirement.allowedPredatorTypeKeys,
            ).size !==
            requirement.allowedPredatorTypeKeys.length
          ) {
            errors.push(
              `La definición ${definition.key || '(sin clave)'} contiene tipos de depredador duplicados.`,
            )
          }

          break

        case 'humanity':
          if (
            !Number.isInteger(
              requirement.min,
            ) ||
            requirement.min < 0 ||
            requirement.min > 10
          ) {
            errors.push(
              `La definición ${definition.key || '(sin clave)'} contiene un requisito de Humanidad no válido.`,
            )
          }

          break

        case 'generation':
          if (
            !Number.isInteger(
              requirement.max,
            ) ||
            requirement.max < 1 ||
            requirement.max > 16
          ) {
            errors.push(
              `La definición ${definition.key || '(sin clave)'} contiene un requisito de Generación no válido.`,
            )
          }

          break

        case 'thinBlood':
          break

        default: {
          const exhaustiveCheck: never =
            requirement

          void exhaustiveCheck
        }
      }
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

    if (
      definition.minimumParentRating !== undefined &&
      (
        !Number.isInteger(
          definition.minimumParentRating,
        ) ||
        definition.minimumParentRating < 1 ||
        definition.minimumParentRating > 6
      )
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} contiene un mínimo de padre no válido.`,
      )
    }

    if (
      definition.minimumParentRating !== undefined &&
      !definition.requiresParentSelection
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} declara un mínimo de padre sin requerir selección padre.`,
      )
    }

    if (
      definition.parentRatingConstraints &&
      !definition.requiresParentSelection
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} declara restricciones por puntuación del padre sin requerir selección padre.`,
      )
    }

    const constrainedParentRatings =
      definition.parentRatingConstraints?.map(
        (constraint) =>
          constraint.parentRating,
      ) ?? []

    if (
      new Set(
        constrainedParentRatings,
      ).size !==
      constrainedParentRatings.length
    ) {
      errors.push(
        `La definición ${definition.key || '(sin clave)'} contiene restricciones duplicadas para la misma puntuación del padre.`,
      )
    }

    for (
      const constraint of
        definition.parentRatingConstraints ?? []
    ) {
      if (
        !Number.isInteger(
          constraint.parentRating,
        ) ||
        constraint.parentRating < 1 ||
        constraint.parentRating > 6
      ) {
        errors.push(
          `La definición ${definition.key || '(sin clave)'} contiene una puntuación de padre no válida.`,
        )
      }

      if (
        constraint.allowedRatings.length === 0 ||
        constraint.allowedRatings.some(
          (rating) =>
            !definition.allowedRatings.includes(
              rating,
            ),
        )
      ) {
        errors.push(
          `La definición ${definition.key || '(sin clave)'} contiene una restricción de puntuaciones incompatible con allowedRatings.`,
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
    selection.details?.kind === 'folkloricBane'
  ) {
    const source =
      selection.details.source.trim()

    if (!source) {
      errors.push(
        `La selección ${selection.selectionId} debe especificar una fuente de daño folclórico.`,
      )
    }
  }

  if (
    selection.details?.kind === 'folkloricBlock'
  ) {
    const taboo =
      selection.details.taboo.trim()

    if (!taboo) {
      errors.push(
        `La selección ${selection.selectionId} debe especificar un tabú folclórico.`,
      )
    }
  }

  if (
    selection.details?.kind === 'preyExclusion'
  ) {
    const excludedPrey =
      selection.details.excludedPrey.trim()

    if (!excludedPrey) {
      errors.push(
        `La selección ${selection.selectionId} debe especificar una presa excluida.`,
      )
    }
  }

  if (
    selection.details?.kind === 'substanceUse'
  ) {
    const substance =
      selection.details.substance.trim()

    if (!substance) {
      errors.push(
        `La selección ${selection.selectionId} debe especificar una sustancia.`,
      )
    }

    if (
      selection.definitionKey ===
        'functional-addict'
    ) {
      const poolCategory =
        selection.details.poolCategory?.trim()

      if (!poolCategory) {
        errors.push(
          `La selección ${selection.selectionId} de Adicto Funcional debe especificar una categoría de reserva.`,
        )
      }
    }
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

    const originConstraint =
      definition.originRatingConstraints
        ?.find(
          (constraint) =>
            constraint.origin ===
            selection.origin,
        )

    const allowedRatings =
      originConstraint
        ?.allowedRatings ??
      definition.allowedRatings

    if (
      !allowedRatings.includes(
        selection.rating,
      )
    ) {
      errors.push(
        `La puntuación ${selection.rating} no está permitida para ${definition.name} con origen ${selection.origin}.`,
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
      } else {
        if (
          definition.minimumParentRating !== undefined &&
          parent.rating <
            definition.minimumParentRating
        ) {
          errors.push(
            `La selección ${selection.selectionId} requiere que su selección padre tenga al menos puntuación ${definition.minimumParentRating}.`,
          )
        }

        const parentConstraint =
          definition.parentRatingConstraints?.find(
            (constraint) =>
              constraint.parentRating ===
              parent.rating,
          )

        if (
          parentConstraint &&
          !parentConstraint.allowedRatings.includes(
            selection.rating,
          )
        ) {
          errors.push(
            `La puntuación ${selection.rating} no está permitida para ${definition.name} con un padre de puntuación ${parent.rating}.`,
          )
        }
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
