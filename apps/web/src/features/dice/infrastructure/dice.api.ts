import type {
  CharacterDiceRollCommand,
  DiceGateway,
  DicePoolComponent,
  DicePoolSnapshot,
  DiceRollOutcome,
  DiceRollSnapshot,
  ExecutedDiceRoll,
  ManualDiceRollCommand,
  ResolvedDice,
} from '../types/dice.types.ts'

type FetchImplementation = typeof globalThis.fetch
type UnknownRecord = Record<string, unknown>

export class DiceApiError extends Error {
  readonly status: number
  readonly code: string
  readonly payload: unknown

  constructor(status: number, code: string, payload: unknown = null) {
    super(code)
    this.name = 'DiceApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

function record(value: unknown): UnknownRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new DiceApiError(502, 'INVALID_DICE_RESPONSE')
  }
  return value as UnknownRecord
}

function integer(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value)
  ) {
    throw new DiceApiError(502, 'INVALID_DICE_RESPONSE')
  }
  return value
}

function string(value: unknown): string {
  if (typeof value !== 'string') {
    throw new DiceApiError(502, 'INVALID_DICE_RESPONSE')
  }
  return value
}

function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') {
    throw new DiceApiError(502, 'INVALID_DICE_RESPONSE')
  }
  return value
}

function nullableInteger(value: unknown): number | null {
  return value === null ? null : integer(value)
}

function nullableBoolean(value: unknown): boolean | null {
  return value === null ? null : boolean(value)
}

function component(value: unknown): DicePoolComponent {
  const item = record(value)
  return {
    key: string(item.key),
    label: string(item.label),
    value: integer(item.value),
  }
}

function pool(value: unknown): DicePoolSnapshot {
  const item = record(value)
  if (!Array.isArray(item.components)) {
    throw new DiceApiError(502, 'INVALID_DICE_RESPONSE')
  }
  return {
    components: item.components.map(component),
    basePool: integer(item.basePool),
    modifier: integer(item.modifier),
    finalPool: integer(item.finalPool),
    normalDice: integer(item.normalDice),
    hungerDice: integer(item.hungerDice),
    difficulty: nullableInteger(item.difficulty),
  }
}

function die(value: unknown): ResolvedDice {
  const item = record(value)
  const type = string(item.type)
  if (type !== 'normal' && type !== 'hunger') {
    throw new DiceApiError(502, 'INVALID_DICE_RESPONSE')
  }
  return {
    value: integer(item.value),
    type,
    isSuccess: boolean(item.isSuccess),
    isCriticalTen: boolean(item.isCriticalTen),
    isBestialFailureDie: boolean(item.isBestialFailureDie),
  }
}

function roll(value: unknown): DiceRollSnapshot {
  const item = record(value)
  if (!Array.isArray(item.dice)) {
    throw new DiceApiError(502, 'INVALID_DICE_RESPONSE')
  }
  const outcome = string(item.outcome)
  const outcomes: readonly DiceRollOutcome[] = [
    'success',
    'failure',
    'critical',
    'messy_critical',
    'bestial_failure',
  ]
  if (!outcomes.includes(outcome as DiceRollOutcome)) {
    throw new DiceApiError(502, 'INVALID_DICE_RESPONSE')
  }
  return {
    dice: item.dice.map(die),
    difficulty: nullableInteger(item.difficulty),
    regularSuccesses: integer(item.regularSuccesses),
    criticalPairs: integer(item.criticalPairs),
    criticalBonusSuccesses: integer(item.criticalBonusSuccesses),
    totalSuccesses: integer(item.totalSuccesses),
    outcome: outcome as DiceRollOutcome,
    meetsDifficulty: nullableBoolean(item.meetsDifficulty),
  }
}

export function parseExecutedDiceRoll(
  value: unknown,
): ExecutedDiceRoll {
  const item = record(value)
  return {
    pool: pool(item.pool),
    roll: roll(item.roll),
  }
}

async function successfulPayload(
  response: Response,
): Promise<unknown> {
  let value: unknown = null
  try {
    value = await response.json()
  } catch {
    value = null
  }
  if (!response.ok) {
    const body =
      typeof value === 'object' && value !== null
        ? value as UnknownRecord
        : {}
    throw new DiceApiError(
      response.status,
      typeof body.code === 'string'
        ? body.code
        : 'DICE_REQUEST_FAILED',
      value,
    )
  }
  return value
}

export function createDiceGateway(
  fetchImplementation: FetchImplementation = globalThis.fetch,
): DiceGateway {
  async function post(
    endpoint: string,
    command: ManualDiceRollCommand | CharacterDiceRollCommand,
  ): Promise<ExecutedDiceRoll> {
    const response = await fetchImplementation(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    })
    return parseExecutedDiceRoll(
      await successfulPayload(response),
    )
  }

  return {
    manual(command) {
      return post('/api/dice/manual', command)
    },
    character(characterId, command) {
      return post(
        `/api/dice/characters/${encodeURIComponent(characterId)}`,
        command,
      )
    },
  }
}
