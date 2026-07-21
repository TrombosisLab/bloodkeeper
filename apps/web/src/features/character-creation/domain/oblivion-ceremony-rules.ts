import type {
  DisciplinePowerKey,
} from '../types/discipline-power.types.ts'

import type {
  OblivionCeremonyDefinition,
  OblivionCeremonyKey,
} from '../types/oblivion-ceremony.types.ts'

export interface OblivionCeremonyValidationResult {
  valid:
    boolean

  errors:
    string[]
}

export function canLearnOblivionCeremony(
  ceremony:
    OblivionCeremonyDefinition,

  oblivionLevel:
    number,

  learnedPowerKeys:
    DisciplinePowerKey[],
): OblivionCeremonyValidationResult {
  const errors:
    string[] = []

  if (
    !Number.isInteger(
      oblivionLevel,
    ) ||
    oblivionLevel < 0 ||
    oblivionLevel > 5
  ) {
    errors.push(
      'La puntuación de Olvido debe estar entre 0 y 5.',
    )
  }

  if (
    !Number.isInteger(
      ceremony.level,
    ) ||
    ceremony.level < 1 ||
    ceremony.level > 5
  ) {
    errors.push(
      'El nivel de la Ceremonia debe estar entre 1 y 5.',
    )
  }

  if (
    ceremony.level >
    oblivionLevel
  ) {
    errors.push(
      'El nivel de la Ceremonia no puede superar la puntuación de Olvido.',
    )
  }

  const prerequisites =
    ceremony.requirements
      ?.prerequisitePowerKeys ??
    []

  for (
    const prerequisite of
    prerequisites
  ) {
    if (
      !learnedPowerKeys.includes(
        prerequisite,
      )
    ) {
      errors.push(
        `Falta el poder previo requerido: ${prerequisite}.`,
      )
    }
  }

  return {
    valid:
      errors.length === 0,

    errors: [
      ...new Set(
        errors,
      ),
    ],
  }
}

export function addKnownOblivionCeremony(
  ceremonyKeys:
    OblivionCeremonyKey[],

  ceremonyKey:
    OblivionCeremonyKey,
): OblivionCeremonyKey[] {
  if (
    ceremonyKeys.includes(
      ceremonyKey,
    )
  ) {
    return ceremonyKeys
  }

  return [
    ...ceremonyKeys,
    ceremonyKey,
  ]
}

export function removeKnownOblivionCeremony(
  ceremonyKeys:
    OblivionCeremonyKey[],

  ceremonyKey:
    OblivionCeremonyKey,
): OblivionCeremonyKey[] {
  return ceremonyKeys.filter(
    (key) =>
      key !== ceremonyKey,
  )
}

export function normalizeKnownOblivionCeremonies(
  definitions:
    OblivionCeremonyDefinition[],

  ceremonyKeys:
    OblivionCeremonyKey[],

  oblivionLevel:
    number,

  learnedPowerKeys:
    DisciplinePowerKey[],
): OblivionCeremonyKey[] {
  const definitionMap =
    new Map(
      definitions.map(
        (definition) => [
          definition.key,
          definition,
        ],
      ),
    )

  const seen =
    new Set<
      OblivionCeremonyKey
    >()

  const normalized:
    OblivionCeremonyKey[] = []

  for (
    const ceremonyKey of
    ceremonyKeys
  ) {
    if (
      seen.has(
        ceremonyKey,
      )
    ) {
      continue
    }

    const definition =
      definitionMap.get(
        ceremonyKey,
      )

    if (!definition) {
      continue
    }

    if (
      !canLearnOblivionCeremony(
        definition,
        oblivionLevel,
        learnedPowerKeys,
      ).valid
    ) {
      continue
    }

    seen.add(
      ceremonyKey,
    )

    normalized.push(
      ceremonyKey,
    )
  }

  return normalized
}

/*
 * Reglas específicas de creación inicial.
 *
 * Se mantienen separadas de las reglas generales de aprendizaje:
 * durante la creación inicial solo puede seleccionarse una Ceremonia,
 * debe ser de nivel 1 y el personaje debe conocer el Poder de Olvido
 * requerido por dicha Ceremonia.
 */

export const MAX_INITIAL_OBLIVION_CEREMONIES = 1

export function getLearnableInitialOblivionCeremonies(
  definitions:
    OblivionCeremonyDefinition[],
  oblivionLevel: number,
  learnedPowerKeys: string[],
): OblivionCeremonyDefinition[] {
  if (oblivionLevel < 1) {
    return []
  }

  return definitions.filter(
    (ceremony) =>
      ceremony.level === 1 &&
      canLearnOblivionCeremony(
        ceremony,
        oblivionLevel,
        learnedPowerKeys,
      ).valid,
  )
}

export function validateInitialOblivionCeremonySelection(
  definitions:
    OblivionCeremonyDefinition[],
  selectedCeremonyKeys:
    OblivionCeremonyKey[],
  oblivionLevel: number,
  learnedPowerKeys: string[],
): OblivionCeremonyValidationResult {
  const errors: string[] = []

  const uniqueKeys =
    [...new Set(
      selectedCeremonyKeys,
    )]

  if (
    uniqueKeys.length !==
    selectedCeremonyKeys.length
  ) {
    errors.push(
      'No se puede seleccionar la misma Ceremonia más de una vez.',
    )
  }

  if (
    uniqueKeys.length >
    MAX_INITIAL_OBLIVION_CEREMONIES
  ) {
    errors.push(
      'Durante la creación inicial solo puede seleccionarse una Ceremonia de Olvido.',
    )
  }

  for (
    const ceremonyKey of uniqueKeys
  ) {
    const ceremony =
      definitions.find(
        (candidate) =>
          candidate.key ===
          ceremonyKey,
      )

    if (!ceremony) {
      errors.push(
        `Ceremonia desconocida: ${ceremonyKey}.`,
      )

      continue
    }

    if (ceremony.level !== 1) {
      errors.push(
        `${ceremony.name} no es una Ceremonia disponible durante la creación inicial.`,
      )

      continue
    }

    const result =
      canLearnOblivionCeremony(
        ceremony,
        oblivionLevel,
        learnedPowerKeys,
      )

    errors.push(
      ...result.errors,
    )
  }

  return {
    valid:
      errors.length === 0,
    errors,
  }
}
