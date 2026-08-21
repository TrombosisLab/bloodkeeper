import {
  assertValidCharacterHunger,
  CHARACTER_HUNGER_MAX,
} from './character-hunger.rules'

export type CharacterRouseCheckReason =
  | 'awakening'
  | 'blushOfLife'
  | 'bloodSurge'
  | 'healing'
  | 'disciplinePower'
  | 'ritualOrCeremony'
  | 'other'

export type CharacterRouseCheckConsequence =
  | 'none'
  | 'hungerFrenzyTestRequired'
  | 'torporTriggered'

export type CharacterRouseCheckViolation =
  | 'ROUSE_ROLL_INVALID'
  | 'ROUSE_ROLL_COUNT_INVALID'
  | 'ROUSE_DISCIPLINE_CONTEXT_INVALID'
  | 'ROUSE_VOLUNTARY_AT_HUNGER_FIVE'

export class InvalidCharacterRouseCheckError
  extends Error {
  readonly violations:
    readonly CharacterRouseCheckViolation[]

  constructor(
    violations:
      readonly CharacterRouseCheckViolation[],
  ) {
    super('Character Rouse Check is invalid')
    this.name =
      'InvalidCharacterRouseCheckError'
    this.violations = [...violations]
  }
}

export interface CharacterRouseCheckDiceContext {
  readonly reason: CharacterRouseCheckReason
  readonly bloodPotency?: number
  readonly disciplinePowerLevel?: number
}

export interface CharacterRouseCheckInput
  extends CharacterRouseCheckDiceContext {
  readonly rolls: readonly number[]
  readonly hungerBefore: number
  readonly forced?: boolean
}

export interface CharacterRouseCheckResolution {
  readonly rolls: readonly number[]
  readonly selectedResult: number
  readonly success: boolean
  readonly hungerIncrease: 0 | 1
  readonly consequence:
    CharacterRouseCheckConsequence
}

function isD10(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 10
  )
}

function assertValidDisciplineContext(
  input: CharacterRouseCheckDiceContext,
): void {
  if (input.reason !== 'disciplinePower') {
    return
  }

  if (
    input.bloodPotency === undefined ||
    input.disciplinePowerLevel === undefined ||
    !Number.isInteger(input.bloodPotency) ||
    input.bloodPotency < 0 ||
    !Number.isInteger(input.disciplinePowerLevel) ||
    input.disciplinePowerLevel < 1 ||
    input.disciplinePowerLevel > 5
  ) {
    throw new InvalidCharacterRouseCheckError([
      'ROUSE_DISCIPLINE_CONTEXT_INVALID',
    ])
  }
}

export function getCharacterRouseCheckDiceCount(
  input: CharacterRouseCheckDiceContext,
): 1 | 2 {
  assertValidDisciplineContext(input)

  if (input.reason !== 'disciplinePower') {
    return 1
  }

  const bloodPotency =
    input.bloodPotency as number
  const disciplinePowerLevel =
    input.disciplinePowerLevel as number

  if (
    bloodPotency >= 5 &&
    disciplinePowerLevel <= 3
  ) {
    return 2
  }

  if (
    bloodPotency >= 3 &&
    disciplinePowerLevel <= 2
  ) {
    return 2
  }

  if (
    bloodPotency >= 1 &&
    disciplinePowerLevel <= 1
  ) {
    return 2
  }

  return 1
}

function deriveConsequence(
  input: CharacterRouseCheckInput,
  success: boolean,
): CharacterRouseCheckConsequence {
  if (
    success ||
    input.hungerBefore <
      CHARACTER_HUNGER_MAX
  ) {
    return 'none'
  }

  if (input.reason === 'awakening') {
    return 'torporTriggered'
  }

  return 'hungerFrenzyTestRequired'
}

export function resolveCharacterRouseCheck(
  input: CharacterRouseCheckInput,
): CharacterRouseCheckResolution {
  assertValidCharacterHunger(
    input.hungerBefore,
  )

  if (
    input.hungerBefore ===
      CHARACTER_HUNGER_MAX &&
    input.forced !== true
  ) {
    throw new InvalidCharacterRouseCheckError([
      'ROUSE_VOLUNTARY_AT_HUNGER_FIVE',
    ])
  }

  const diceCount =
    getCharacterRouseCheckDiceCount(input)

  if (input.rolls.length !== diceCount) {
    throw new InvalidCharacterRouseCheckError([
      'ROUSE_ROLL_COUNT_INVALID',
    ])
  }

  if (!input.rolls.every(isD10)) {
    throw new InvalidCharacterRouseCheckError([
      'ROUSE_ROLL_INVALID',
    ])
  }

  const rolls = Object.freeze([
    ...input.rolls,
  ])

  const selectedResult =
    Math.max(...rolls)
  const success = selectedResult >= 6

  const hungerIncrease: 0 | 1 =
    success ||
    input.hungerBefore ===
      CHARACTER_HUNGER_MAX
      ? 0
      : 1

  return Object.freeze({
    rolls,
    selectedResult,
    success,
    hungerIncrease,
    consequence:
      deriveConsequence(
        input,
        success,
      ),
  })
}
