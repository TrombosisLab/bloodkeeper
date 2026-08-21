import type {
  CharacterRouseCheckConsequence,
  CharacterRouseCheckGateway,
  CharacterRouseCheckReason,
  CharacterRouseCheckRequest,
  CharacterRouseCheckResult,
} from '../types/character-rouse-check-persistence.types.ts'

export class CharacterRouseCheckApiError
  extends Error {
  readonly status: number
  readonly code: string
  readonly violations: readonly unknown[]

  constructor(
    status: number,
    code: string,
    violations: readonly unknown[] = [],
  ) {
    super(code)
    this.name = 'CharacterRouseCheckApiError'
    this.status = status
    this.code = code
    this.violations = [...violations]
  }
}

type FetchImplementation =
  typeof globalThis.fetch

type UnknownRecord =
  Record<string, unknown>

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const reasons:
  readonly CharacterRouseCheckReason[] = [
    'awakening',
    'blushOfLife',
    'bloodSurge',
    'healing',
    'disciplinePower',
    'ritualOrCeremony',
    'other',
  ]

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function integer(
  value: unknown,
  min: number,
  max: number,
): number | null {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= min &&
    (value as number) <= max
  )
    ? value as number
    : null
}

function positiveInteger(
  value: unknown,
): number | null {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= 1
  )
    ? value as number
    : null
}

function uuid(
  value: unknown,
): string | null {
  return (
    typeof value === 'string' &&
    uuidPattern.test(value)
  )
    ? value
    : null
}

function reason(
  value: unknown,
): CharacterRouseCheckReason | null {
  return (
    typeof value === 'string' &&
    reasons.includes(
      value as CharacterRouseCheckReason,
    )
  )
    ? value as CharacterRouseCheckReason
    : null
}

function consequence(
  value: unknown,
): CharacterRouseCheckConsequence | null {
  if (!isRecord(value)) {
    return null
  }

  if (value.kind === 'none') {
    return {
      kind: 'none',
    }
  }

  if (
    value.kind ===
      'hungerFrenzyTestRequired' &&
    value.difficulty === 4
  ) {
    return {
      kind:
        'hungerFrenzyTestRequired',
      difficulty: 4,
    }
  }

  if (value.kind === 'torporTriggered') {
    return {
      kind: 'torporTriggered',
    }
  }

  return null
}

export function parseCharacterRouseCheckResponse(
  value: unknown,
): CharacterRouseCheckResult {
  if (!isRecord(value)) {
    throw new CharacterRouseCheckApiError(
      502,
      'INVALID_CHARACTER_ROUSE_CHECK_RESPONSE',
    )
  }

  const operationId =
    uuid(value.operationId)
  const parsedReason =
    reason(value.reason)
  const selectedResult =
    integer(value.selectedResult, 1, 10)
  const hungerBefore =
    integer(value.hungerBefore, 0, 5)
  const hungerAfter =
    integer(value.hungerAfter, 0, 5)
  const parsedConsequence =
    consequence(value.consequence)
  const rollHistoryId =
    uuid(value.rollHistoryId)
  const characterRevision =
    positiveInteger(
      value.characterRevision,
    )

  const rolls =
    Array.isArray(value.rolls) &&
    value.rolls.length >= 1 &&
    value.rolls.length <= 2 &&
    value.rolls.every(
      (roll) =>
        integer(roll, 1, 10) !== null,
    )
      ? value.rolls as number[]
      : null

  const validCreatedAt =
    typeof value.createdAt === 'string' &&
    !Number.isNaN(
      Date.parse(value.createdAt),
    )

  if (
    operationId === null ||
    parsedReason === null ||
    rolls === null ||
    selectedResult === null ||
    !rolls.includes(selectedResult) ||
    typeof value.success !== 'boolean' ||
    hungerBefore === null ||
    hungerAfter === null ||
    parsedConsequence === null ||
    rollHistoryId === null ||
    characterRevision === null ||
    !validCreatedAt
  ) {
    throw new CharacterRouseCheckApiError(
      502,
      'INVALID_CHARACTER_ROUSE_CHECK_RESPONSE',
    )
  }

  return {
    operationId,
    reason: parsedReason,
    rolls: [...rolls],
    selectedResult,
    success: value.success,
    hungerBefore,
    hungerAfter,
    consequence:
      parsedConsequence,
    rollHistoryId,
    characterRevision,
    createdAt: value.createdAt as string,
  }
}

async function responseError(
  response: Response,
): Promise<CharacterRouseCheckApiError> {
  let code =
    'CHARACTER_ROUSE_CHECK_REQUEST_FAILED'
  let violations: readonly unknown[] = []

  try {
    const body: unknown =
      await response.json()

    if (isRecord(body)) {
      if (typeof body.code === 'string') {
        code = body.code
      }

      if (Array.isArray(body.violations)) {
        violations = body.violations
      }
    }
  } catch {
    // El status HTTP continúa siendo suficiente.
  }

  return new CharacterRouseCheckApiError(
    response.status,
    code,
    violations,
  )
}

export function createCharacterRouseCheckOperationId():
  string {
  const cryptoApi = globalThis.crypto

  if (cryptoApi === undefined) {
    throw new CharacterRouseCheckApiError(
      0,
      'ROUSE_CHECK_OPERATION_ID_UNAVAILABLE',
    )
  }

  if (
    typeof cryptoApi.randomUUID ===
      'function'
  ) {
    return cryptoApi.randomUUID()
  }

  if (
    typeof cryptoApi.getRandomValues !==
      'function'
  ) {
    throw new CharacterRouseCheckApiError(
      0,
      'ROUSE_CHECK_OPERATION_ID_UNAVAILABLE',
    )
  }

  const bytes =
    cryptoApi.getRandomValues(
      new Uint8Array(16),
    )

  bytes[6] =
    (bytes[6] & 0x0f) | 0x40
  bytes[8] =
    (bytes[8] & 0x3f) | 0x80

  const hex =
    Array.from(
      bytes,
      (item) =>
        item
          .toString(16)
          .padStart(2, '0'),
    ).join('')

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-')
}

export function createCharacterRouseCheckGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): CharacterRouseCheckGateway {
  return {
    async execute(
      characterId: string,
      request: CharacterRouseCheckRequest,
    ): Promise<CharacterRouseCheckResult> {
      let response: Response

      try {
        response =
          await fetchImplementation(
            `/api/characters/${encodeURIComponent(characterId)}/blood/rouse-check`,
            {
              method: 'POST',
              credentials: 'include',
              headers: {
                Accept: 'application/json',
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify(
                request,
              ),
            },
          )
      } catch {
        throw new CharacterRouseCheckApiError(
          0,
          'CHARACTER_ROUSE_CHECK_NETWORK_ERROR',
        )
      }

      if (!response.ok) {
        throw await responseError(response)
      }

      try {
        return parseCharacterRouseCheckResponse(
          await response.json(),
        )
      } catch (error: unknown) {
        if (
          error instanceof
            CharacterRouseCheckApiError
        ) {
          throw error
        }

        throw new CharacterRouseCheckApiError(
          502,
          'INVALID_CHARACTER_ROUSE_CHECK_RESPONSE',
        )
      }
    },
  }
}
