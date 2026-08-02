import type {
  CharacterDisciplinesDraft,
  DisciplineKey,
} from '../types/discipline.types.ts'

import type {
  DisciplinePowerDefinition,
  DisciplinePowerKey,
} from '../types/discipline-power.types.ts'

import {
  canLearnDisciplinePower,
  getCharacterDisciplineLevel,
} from './discipline-power-rules.ts'

export type DisciplinePowerAcquisitionContext =
  | 'characterCreation'
  | 'characterAdvancement'

export interface DisciplinePowerAcquisitionResult {
  context:
    DisciplinePowerAcquisitionContext

  structurallyEligible: boolean

  valid: boolean

  errors: string[]
}

export const DISCIPLINE_POWER_ADVANCEMENT_RULES_REQUIRED =
  'La adquisición posterior requiere reglas de evolución específicas antes de autorizarse.'

/*
 * Autoriza únicamente adquisiciones cuyo contexto
 * tenga reglas vigentes. Las dependencias estructurales
 * son comunes, pero el reparto inicial no se reutiliza
 * como regla de evolución.
 */
export function validateDisciplinePowerAcquisition(
  definitions:
    DisciplinePowerDefinition[],
  disciplines:
    CharacterDisciplinesDraft,
  disciplineKey:
    DisciplineKey,
  powerKey:
    DisciplinePowerKey,
  acquiredPowerKeys:
    DisciplinePowerKey[],
  context:
    DisciplinePowerAcquisitionContext,
): DisciplinePowerAcquisitionResult {
  const structuralErrors: string[] = []

  const power = definitions.find(
    (candidate) =>
      candidate.key === powerKey,
  )

  if (!power) {
    structuralErrors.push(
      `El poder ${powerKey} no existe en el catálogo.`,
    )
  } else if (
    power.disciplineKey !==
    disciplineKey
  ) {
    structuralErrors.push(
      `El poder ${powerKey} no pertenece a esta Disciplina.`,
    )
  } else if (
    acquiredPowerKeys.includes(
      powerKey,
    )
  ) {
    structuralErrors.push(
      `El poder ${powerKey} ya está adquirido.`,
    )
  } else {
    structuralErrors.push(
      ...canLearnDisciplinePower(
        power,
        disciplines,
        acquiredPowerKeys,
      ).errors,
    )
  }

  const errors = [
    ...structuralErrors,
  ]

  if (
    context ===
    'characterCreation'
  ) {
    const powerLimit =
      getCharacterDisciplineLevel(
        disciplines,
        disciplineKey,
      )

    if (
      acquiredPowerKeys.length >=
      powerLimit
    ) {
      errors.push(
        `La creación permite ${powerLimit} poderes para esta Disciplina.`,
      )
    }
  } else {
    errors.push(
      DISCIPLINE_POWER_ADVANCEMENT_RULES_REQUIRED,
    )
  }

  return {
    context,
    structurallyEligible:
      structuralErrors.length === 0,
    valid: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}
