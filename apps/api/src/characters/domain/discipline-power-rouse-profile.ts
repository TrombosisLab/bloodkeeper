import type {
  CharacterRulesDisciplinePowerRouseCost,
  CharacterRulesDisciplinePowerRouseCostExemption,
  CharacterRulesDisciplinePowerDefinition,
  CharacterRulesDisciplineKey,
} from '@v5r/character-rules'

import {
  getCharacterRouseCheckDiceCount,
} from './character-rouse-check.rules'

import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'

import type {
  PersistedCharacterDraft,
} from './persisted-character.types'

export type CharacterDisciplinePowerRouseProfileStatus =
  | 'unknownPower'
  | 'inactivePower'
  | 'notOwned'
  | 'bloodStateUnavailable'
  | 'noRouseCheck'
  | 'ready'
  | 'contextual'

export type CharacterDisciplinePowerRouseExecution =
  | 'none'
  | 'singleCheck'
  | 'contextual'

export interface CharacterDisciplinePowerRouseProfile {
  readonly powerKey: string
  readonly powerName: string | null
  readonly disciplineKey:
    CharacterRulesDisciplineKey | null
  readonly level: number | null
  readonly status:
    CharacterDisciplinePowerRouseProfileStatus
  readonly execution:
    CharacterDisciplinePowerRouseExecution
  readonly rouseCost:
    CharacterRulesDisciplinePowerRouseCost | null
  readonly requiredChecks: number | null
  readonly dicePerCheck: 1 | 2 | null
  readonly exemptions:
    readonly CharacterRulesDisciplinePowerRouseCostExemption[]
}

export interface CharacterDisciplinePowerRouseProfileInput {
  readonly catalog: CharacterRulesCatalog
  readonly character: Pick<
    PersistedCharacterDraft,
    'blood' | 'disciplines'
  >
  readonly powerKey: string
}

function frozenExemptions(
  cost: CharacterRulesDisciplinePowerRouseCost | null,
): readonly CharacterRulesDisciplinePowerRouseCostExemption[] {
  if (
    cost === null ||
    !('exemptions' in cost) ||
    cost.exemptions === undefined
  ) {
    return Object.freeze([])
  }

  return Object.freeze([...cost.exemptions])
}

function requiredChecks(
  cost: CharacterRulesDisciplinePowerRouseCost,
): number | null {
  return cost.kind === 'fixed'
    ? cost.checks
    : null
}

function isSingleCheckCost(
  cost: CharacterRulesDisciplinePowerRouseCost,
): boolean {
  return (
    cost.kind === 'fixed' &&
    cost.checks === 1 &&
    (cost.exemptions === undefined ||
      cost.exemptions.length === 0)
  )
}

function baseProfile(
  powerKey: string,
  power: CharacterRulesDisciplinePowerDefinition | null,
  status: CharacterDisciplinePowerRouseProfileStatus,
  execution: CharacterDisciplinePowerRouseExecution,
  rouseCost: CharacterRulesDisciplinePowerRouseCost | null,
  dicePerCheck: 1 | 2 | null,
): CharacterDisciplinePowerRouseProfile {
  return Object.freeze({
    powerKey,
    powerName: power?.name ?? null,
    disciplineKey: power?.disciplineKey ?? null,
    level: power?.level ?? null,
    status,
    execution,
    rouseCost,
    requiredChecks:
      rouseCost === null || rouseCost.kind === 'none'
        ? null
        : requiredChecks(rouseCost),
    dicePerCheck,
    exemptions: frozenExemptions(rouseCost),
  })
}

export function resolveCharacterDisciplinePowerRouseProfile(
  input: CharacterDisciplinePowerRouseProfileInput,
): CharacterDisciplinePowerRouseProfile {
  const power =
    input.catalog.disciplineCatalog.powers.find(
      (candidate) =>
        candidate.key === input.powerKey,
    ) ?? null

  if (power === null) {
    return baseProfile(
      input.powerKey,
      null,
      'unknownPower',
      'none',
      null,
      null,
    )
  }

  if (!power.active) {
    return baseProfile(
      input.powerKey,
      power,
      'inactivePower',
      'none',
      power.mechanics?.rouseCost ?? null,
      null,
    )
  }

  const discipline = input.character.disciplines.find(
    (candidate) =>
      candidate.disciplineKey === power.disciplineKey,
  )

  if (
    discipline === undefined ||
    !discipline.powerKeys.includes(power.key)
  ) {
    return baseProfile(
      input.powerKey,
      power,
      'notOwned',
      'none',
      power.mechanics?.rouseCost ?? null,
      null,
    )
  }

  const rouseCost =
    power.mechanics?.rouseCost ?? {
      kind: 'none' as const,
    }

  if (rouseCost.kind === 'none') {
    return baseProfile(
      input.powerKey,
      power,
      'noRouseCheck',
      'none',
      rouseCost,
      null,
    )
  }

  const bloodPotency =
    input.character.blood?.bloodPotency

  if (bloodPotency === undefined) {
    return baseProfile(
      input.powerKey,
      power,
      'bloodStateUnavailable',
      'none',
      rouseCost,
      null,
    )
  }

  const dicePerCheck =
    getCharacterRouseCheckDiceCount({
      reason: 'disciplinePower',
      bloodPotency,
      disciplinePowerLevel: power.level,
    })

  const singleCheck = isSingleCheckCost(rouseCost)

  return baseProfile(
    input.powerKey,
    power,
    singleCheck ? 'ready' : 'contextual',
    singleCheck ? 'singleCheck' : 'contextual',
    rouseCost,
    dicePerCheck,
  )
}

export function listCharacterDisciplinePowerRouseProfiles(
  input: Omit<
    CharacterDisciplinePowerRouseProfileInput,
    'powerKey'
  >,
): readonly CharacterDisciplinePowerRouseProfile[] {
  const powerKeys = new Set<string>()

  for (const discipline of input.character.disciplines) {
    for (const powerKey of discipline.powerKeys) {
      powerKeys.add(powerKey)
    }
  }

  const profiles = [...powerKeys]
    .map((powerKey) =>
      resolveCharacterDisciplinePowerRouseProfile({
        ...input,
        powerKey,
      }),
    )

  return Object.freeze(profiles)
}
