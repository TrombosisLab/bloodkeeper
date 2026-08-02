import type {
  CharacterAttributesDraft,
} from '../types/character-attributes-draft.types.ts'

import type {
  CharacterSkillsDraft,
} from '../types/character-skills-draft.types.ts'

import type {
  CharacterDisciplinesDraft,
  DisciplineKey,
} from '../types/discipline.types.ts'

import type {
  DisciplinePowerDefinition,
  DisciplinePowerDicePoolTermDefinition,
  DisciplinePowerKey,
} from '../types/discipline-power.types.ts'

import {
  isDisciplinePowerActive,
} from './discipline-power-catalog-rules.ts'

import {
  getCharacterDisciplineLevel,
} from './discipline-power-rules.ts'

export type DisciplinePowerDiceUnavailableReason =
  | 'POWER_NOT_FOUND'
  | 'POWER_NOT_ACTIVE'
  | 'POWER_NOT_ACQUIRED'
  | 'POWER_HAS_NO_DICE_CHECK'

export type ResolvedDisciplinePowerDicePoolTerm =
  DisciplinePowerDicePoolTermDefinition & {
    value: number
  }

export interface DisciplinePowerDiceInput {
  source: 'disciplinePower'
  powerKey: DisciplinePowerKey
  disciplineKey: DisciplineKey
  poolTerms:
    ResolvedDisciplinePowerDicePoolTerm[]
}

export type DisciplinePowerDiceReadResult =
  | {
      status: 'ready'
      input: DisciplinePowerDiceInput
    }
  | {
      status: 'unavailable'
      reason:
        DisciplinePowerDiceUnavailableReason
    }

function resolvePoolTerm(
  term:
    DisciplinePowerDicePoolTermDefinition,
  attributes:
    CharacterAttributesDraft,
  skills:
    CharacterSkillsDraft,
  disciplines:
    CharacterDisciplinesDraft,
): ResolvedDisciplinePowerDicePoolTerm {
  switch (term.kind) {
    case 'attribute':
      return {
        ...term,
        value: attributes[term.key],
      }

    case 'skill':
      return {
        ...term,
        value: skills[term.key],
      }

    case 'discipline':
      return {
        ...term,
        value:
          getCharacterDisciplineLevel(
            disciplines,
            term.key,
          ),
      }
  }
}

/*
 * Traduce catálogo y estado del personaje a
 * datos de entrada. La suma de la reserva, el
 * Hambre y la ejecución pertenecen al módulo
 * de dados y quedan fuera de este contrato.
 */
export function readDisciplinePowerDiceInput(
  definitions:
    readonly DisciplinePowerDefinition[],
  attributes:
    CharacterAttributesDraft,
  skills:
    CharacterSkillsDraft,
  disciplines:
    CharacterDisciplinesDraft,
  powerKey:
    DisciplinePowerKey,
): DisciplinePowerDiceReadResult {
  const definition = definitions.find(
    (candidate) =>
      candidate.key === powerKey,
  )

  if (!definition) {
    return {
      status: 'unavailable',
      reason: 'POWER_NOT_FOUND',
    }
  }

  if (!isDisciplinePowerActive(definition)) {
    return {
      status: 'unavailable',
      reason: 'POWER_NOT_ACTIVE',
    }
  }

  const characterDiscipline =
    disciplines.find(
      (discipline) =>
        discipline.key ===
        definition.disciplineKey,
    )

  if (
    !characterDiscipline?.powerKeys.includes(
      powerKey,
    )
  ) {
    return {
      status: 'unavailable',
      reason: 'POWER_NOT_ACQUIRED',
    }
  }

  if (!definition.diceCheck) {
    return {
      status: 'unavailable',
      reason: 'POWER_HAS_NO_DICE_CHECK',
    }
  }

  return {
    status: 'ready',
    input: {
      source: 'disciplinePower',
      powerKey: definition.key,
      disciplineKey:
        definition.disciplineKey,
      poolTerms:
        definition.diceCheck.pool.map(
          (term) =>
            resolvePoolTerm(
              term,
              attributes,
              skills,
              disciplines,
            ),
        ),
    },
  }
}
