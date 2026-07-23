import type {
  CharacterLoresheetDefinition,
  CharacterLoresheetLevel,
} from '../types/character-loresheet-definition.types'

export interface CharacterLoresheetDefinitionValidationResult {
  valid: boolean
  errors: string[]
}

const EXPECTED_LORESHEET_LEVELS:
  readonly CharacterLoresheetLevel[] = [
    1,
    2,
    3,
    4,
    5,
  ]

export function validateCharacterLoresheetDefinitions(
  definitions: readonly CharacterLoresheetDefinition[],
): CharacterLoresheetDefinitionValidationResult {
  const errors: string[] = []
  const definitionKeys = new Set<string>()

  for (const definition of definitions) {
    if (definitionKeys.has(definition.key)) {
      errors.push(
        `Ficha de Conocimientos duplicada: ${definition.key}.`,
      )
    }

    definitionKeys.add(definition.key)

    if (definition.key.trim().length === 0) {
      errors.push(
        'Una Ficha de Conocimientos no puede tener una clave vacía.',
      )
    }

    if (definition.name.trim().length === 0) {
      errors.push(
        `La Ficha de Conocimientos ${definition.key} no puede tener un nombre vacío.`,
      )
    }

    const requirements =
      definition.requirements

    if (requirements) {
      const characterKinds =
        requirements.characterKinds ?? []

      const clanKeys =
        requirements.clanKeys ?? []

      const excludedClanKeys =
        requirements.excludedClanKeys ?? []

      if (
        new Set(characterKinds).size !==
        characterKinds.length
      ) {
        errors.push(
          `La Ficha de Conocimientos ${definition.key} contiene tipos de personaje duplicados en sus requisitos.`,
        )
      }

      if (
        new Set(clanKeys).size !==
        clanKeys.length
      ) {
        errors.push(
          `La Ficha de Conocimientos ${definition.key} contiene clanes permitidos duplicados.`,
        )
      }

      if (
        new Set(excludedClanKeys).size !==
        excludedClanKeys.length
      ) {
        errors.push(
          `La Ficha de Conocimientos ${definition.key} contiene clanes excluidos duplicados.`,
        )
      }

      const excludedClanSet =
        new Set(excludedClanKeys)

      for (const clanKey of clanKeys) {
        if (
          excludedClanSet.has(
            clanKey,
          )
        ) {
          errors.push(
            `La Ficha de Conocimientos ${definition.key} no puede permitir y excluir simultáneamente el clan ${clanKey}.`,
          )
        }
      }
    }

    const benefitKeys = new Set<string>()
    const levels = new Set<CharacterLoresheetLevel>()

    for (const benefit of definition.benefits) {
      if (benefitKeys.has(benefit.key)) {
        errors.push(
          `La Ficha de Conocimientos ${definition.key} contiene una ventaja duplicada: ${benefit.key}.`,
        )
      }

      benefitKeys.add(benefit.key)

      if (benefit.key.trim().length === 0) {
        errors.push(
          `La Ficha de Conocimientos ${definition.key} contiene una ventaja con clave vacía.`,
        )
      }

      if (benefit.name.trim().length === 0) {
        errors.push(
          `La ventaja ${benefit.key} de ${definition.key} no puede tener un nombre vacío.`,
        )
      }

      if (levels.has(benefit.level)) {
        errors.push(
          `La Ficha de Conocimientos ${definition.key} repite el nivel ${benefit.level}.`,
        )
      }

      levels.add(benefit.level)
    }

    if (definition.benefits.length !== 5) {
      errors.push(
        `La Ficha de Conocimientos ${definition.key} debe contener exactamente cinco ventajas.`,
      )
    }

    for (const level of EXPECTED_LORESHEET_LEVELS) {
      if (!levels.has(level)) {
        errors.push(
          `La Ficha de Conocimientos ${definition.key} no contiene una ventaja de nivel ${level}.`,
        )
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function getCharacterLoresheetDefinition(
  definitions: readonly CharacterLoresheetDefinition[],
  key: string,
): CharacterLoresheetDefinition | null {
  return (
    definitions.find(
      (definition) =>
        definition.key === key,
    ) ?? null
  )
}
