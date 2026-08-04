import type {
  CharacterDisciplinesDraft,
  DisciplineKey,
} from '../types/discipline.types.ts'

import type {
  DisciplinePowerDefinition,
  DisciplinePowerKey,
} from '../types/discipline-power.types.ts'

import {
  isDisciplinePowerActive,
} from './discipline-power-catalog-rules.ts'

export interface PowerValidationResult {
  valid: boolean
  errors: string[]
}

export function getCharacterDisciplineLevel(
  disciplines:
    CharacterDisciplinesDraft,
  key: DisciplineKey,
): number {
  return disciplines.reduce(
    (total, discipline) =>
      discipline.key === key
        ? total + discipline.value
        : total,
    0,
  )
}

export function getSelectedDisciplinePowerKeys(
  disciplines:
    CharacterDisciplinesDraft,
  key: DisciplineKey,
): DisciplinePowerKey[] {
  return [
    ...new Set(
      disciplines
        .filter(
          discipline =>
            discipline.key === key,
        )
        .flatMap(
          discipline =>
            discipline.powerKeys,
        ),
    ),
  ]
}

export function canLearnDisciplinePower(
  power: DisciplinePowerDefinition,
  disciplines:
    CharacterDisciplinesDraft,
  learnedPowerKeys:
    DisciplinePowerKey[],
): PowerValidationResult {
  const errors: string[] = []

  if (!isDisciplinePowerActive(power)) {
    errors.push(
      `El poder ${power.key} no está activo.`,
    )
  }

  const disciplineLevel =
    getCharacterDisciplineLevel(
      disciplines,
      power.disciplineKey,
    )

  if (
    disciplineLevel <
    power.level
  ) {
    errors.push(
      `Requiere ${power.disciplineKey} a nivel ${power.level}.`,
    )
  }

  const prerequisites =
    power.requirements
      ?.prerequisitePowerKeys ?? []

  for (
    const prerequisite of prerequisites
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

  const amalgam =
    power.requirements?.amalgam

  if (amalgam) {
    const amalgamLevel =
      getCharacterDisciplineLevel(
        disciplines,
        amalgam.disciplineKey,
      )

    if (
      amalgamLevel <
      amalgam.minimumLevel
    ) {
      errors.push(
        `Requiere ${amalgam.disciplineKey} a nivel ${amalgam.minimumLevel} como Amalgama.`,
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function getLearnableDisciplinePowers(
  definitions:
    DisciplinePowerDefinition[],
  disciplineKey:
    DisciplineKey,
  disciplines:
    CharacterDisciplinesDraft,
  learnedPowerKeys:
    DisciplinePowerKey[],
): DisciplinePowerDefinition[] {
  return definitions.filter(
    (power) =>
      power.disciplineKey ===
        disciplineKey &&
      !learnedPowerKeys.includes(
        power.key,
      ) &&
      canLearnDisciplinePower(
        power,
        disciplines,
        learnedPowerKeys,
      ).valid,
  )
}

export function getRequiredPowerCount(
  disciplines:
    CharacterDisciplinesDraft,
  disciplineKey:
    DisciplineKey,
): number {
  return getCharacterDisciplineLevel(
    disciplines,
    disciplineKey,
  )
}

export function validateInitialDisciplinePowers(
  definitions:
    DisciplinePowerDefinition[],
  disciplines:
    CharacterDisciplinesDraft,
  disciplineKey:
    DisciplineKey,
  selectedPowerKeys:
    DisciplinePowerKey[],
): PowerValidationResult {
  const errors: string[] = []

  const uniqueKeys = [
    ...new Set(
      selectedPowerKeys,
    ),
  ]

  if (
    uniqueKeys.length !==
    selectedPowerKeys.length
  ) {
    errors.push(
      'No puedes seleccionar el mismo poder más de una vez.',
    )
  }

  const required =
    getRequiredPowerCount(
      disciplines,
      disciplineKey,
    )

  if (
    selectedPowerKeys.length !==
    required
  ) {
    errors.push(
      `Debes seleccionar exactamente ${required} poderes para esta Disciplina.`,
    )
  }

  for (
    const powerKey of uniqueKeys
  ) {
    const power =
      definitions.find(
        (candidate) =>
          candidate.key ===
          powerKey,
      )

    if (!power) {
      errors.push(
        `El poder ${powerKey} no existe en el catálogo.`,
      )

      continue
    }

    if (
      power.disciplineKey !==
      disciplineKey
    ) {
      errors.push(
        `El poder ${powerKey} no pertenece a esta Disciplina.`,
      )

      continue
    }

    const result =
      canLearnDisciplinePower(
        power,
        disciplines,
        uniqueKeys,
      )

    errors.push(
      ...result.errors,
    )
  }

  return {
    valid: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}

/*
 * Compatibilidad con consumidores anteriores.
 * La validación implementada es exclusivamente
 * la selección inicial durante la creación.
 */
export function validateSelectedPowers(
  definitions:
    DisciplinePowerDefinition[],
  disciplines:
    CharacterDisciplinesDraft,
  disciplineKey:
    DisciplineKey,
  selectedPowerKeys:
    DisciplinePowerKey[],
): PowerValidationResult {
  return validateInitialDisciplinePowers(
    definitions,
    disciplines,
    disciplineKey,
    selectedPowerKeys,
  )
}

export function updateSelectedPower(
  disciplines:
    CharacterDisciplinesDraft,
  disciplineKey:
    DisciplineKey,
  powerKey:
    DisciplinePowerKey,
  selected: boolean,
): CharacterDisciplinesDraft {
  if (!selected) {
    return disciplines.map(
      discipline =>
        discipline.key ===
          disciplineKey
          ? {
              ...discipline,
              powerKeys:
                discipline.powerKeys.filter(
                  key =>
                    key !== powerKey,
                ),
            }
          : discipline,
    )
  }

  const selectedPowerKeys =
    getSelectedDisciplinePowerKeys(
      disciplines,
      disciplineKey,
    )

  if (
    selectedPowerKeys.includes(
      powerKey,
    ) ||
    selectedPowerKeys.length >=
      getCharacterDisciplineLevel(
        disciplines,
        disciplineKey,
      )
  ) {
    return disciplines
  }

  const creationTargetIndex =
    disciplines.findIndex(
      discipline =>
        discipline.key ===
          disciplineKey &&
        discipline.origin !==
          'predatorType' &&
        discipline.powerKeys.length <
          discipline.value,
    )

  const targetIndex =
    creationTargetIndex >= 0
      ? creationTargetIndex
      : disciplines.findIndex(
          discipline =>
            discipline.key ===
              disciplineKey &&
            discipline.powerKeys.length <
              discipline.value,
        )

  if (targetIndex < 0) {
    return disciplines
  }

  return disciplines.map(
    (discipline, index) =>
      index === targetIndex
        ? {
            ...discipline,
            powerKeys: [
              ...discipline.powerKeys,
              powerKey,
            ],
          }
        : discipline,
  )
}

export function normalizeDisciplinePowers(
  definitions:
    DisciplinePowerDefinition[],
  disciplines:
    CharacterDisciplinesDraft,
): CharacterDisciplinesDraft {
  const definitionMap =
    new Map(
      definitions.map(
        (definition) => [
          definition.key,
          definition,
        ],
      ),
    )

  const seenByDiscipline =
    new Map<
      DisciplineKey,
      Set<DisciplinePowerKey>
    >()

  const structurallyNormalized =
    disciplines.map(
      (discipline) => {
      const seen =
        seenByDiscipline.get(
          discipline.key,
        ) ??
        new Set<
          DisciplinePowerKey
        >()

      seenByDiscipline.set(
        discipline.key,
        seen,
      )

      const effectiveLevel =
        getCharacterDisciplineLevel(
          disciplines,
          discipline.key,
        )

      const normalized:
        DisciplinePowerKey[] = []

      for (
        const powerKey of
        discipline.powerKeys
      ) {
        if (
          seen.has(
            powerKey,
          )
        ) {
          continue
        }

        const definition =
          definitionMap.get(
            powerKey,
          )

        if (
          !definition ||
          !isDisciplinePowerActive(
            definition,
          ) ||
          definition.disciplineKey !==
            discipline.key ||
          definition.level >
            effectiveLevel
        ) {
          continue
        }

        seen.add(
          powerKey,
        )

        normalized.push(
          powerKey,
        )
      }

      return {
        ...discipline,
        powerKeys:
          normalized,
      }
      },
    )

  function removeBrokenRequirements(
    current:
      CharacterDisciplinesDraft,
  ): CharacterDisciplinesDraft {
    let candidate = current

    while (true) {
      const learnedPowerKeys =
        candidate.flatMap(
          (discipline) =>
            discipline.powerKeys,
        )

      const next = candidate.map(
        (discipline) => ({
          ...discipline,
          powerKeys:
            discipline.powerKeys.filter(
              (powerKey) => {
                const definition =
                  definitionMap.get(
                    powerKey,
                  )

                return (
                  definition !== undefined &&
                  canLearnDisciplinePower(
                    definition,
                    candidate,
                    learnedPowerKeys,
                  ).valid
                )
              },
            ),
        }),
      )

      const previousCount =
        candidate.reduce(
          (total, discipline) =>
            total +
            discipline.powerKeys.length,
          0,
        )
      const nextCount = next.reduce(
        (total, discipline) =>
          total +
          discipline.powerKeys.length,
        0,
      )

      if (nextCount === previousCount) {
        return next
      }

      candidate = next
    }
  }

  const requirementsNormalized =
    removeBrokenRequirements(
      structurallyNormalized,
    )

  const capacityNormalized =
    requirementsNormalized.map(
      (discipline) => ({
        ...discipline,
        powerKeys:
          discipline.powerKeys.slice(
            0,
            discipline.value,
          ),
      }),
    )

  return removeBrokenRequirements(
    capacityNormalized,
  )
}

export function clearAllSelectedPowers(
  disciplines:
    CharacterDisciplinesDraft,
): CharacterDisciplinesDraft {
  return disciplines.map(
    (discipline) => ({
      ...discipline,
      powerKeys: [],
    }),
  )
}
