import type {
  CharacterBlushOfLifeConsequence,
  CharacterBlushOfLifeGateway,
  CharacterBlushOfLifeRequest,
  CharacterBlushOfLifeResult,
  CharacterBlushOfLifeRouseResult,
} from '../types/character-blush-of-life-persistence.types'

export class CharacterBlushOfLifeApiError
  extends Error {
  constructor(
    readonly status: number,
    readonly code: string | null,
    readonly violations:
      readonly unknown[] | null = null,
  ) {
    super(
      status === 0
        ? 'Network request failed'
        : `Blush of Life request failed (${status})`,
    )
    this.name =
      'CharacterBlushOfLifeApiError'
  }
}

type UnknownRecord =
  Record<string, unknown>

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function asRecord(
  value: unknown,
  path: string,
): UnknownRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error(
      `${path} must be an object`,
    )
  }

  return value as UnknownRecord
}

function asString(
  value: unknown,
  path: string,
): string {
  if (
    typeof value !== 'string' ||
    value.length === 0
  ) {
    throw new Error(
      `${path} must be a string`,
    )
  }

  return value
}

function asUuid(
  value: unknown,
  path: string,
): string {
  const parsed =
    asString(value, path)

  if (
    !uuidPattern.test(parsed)
  ) {
    throw new Error(
      `${path} must be a UUID`,
    )
  }

  return parsed
}

function asHunger(
  value: unknown,
  path: string,
): number {
  if (
    !Number.isInteger(value) ||
    (value as number) < 0 ||
    (value as number) > 5
  ) {
    throw new Error(
      `${path} must be Hunger 0..5`,
    )
  }

  return value as number
}

function asRevision(
  value: unknown,
  path: string,
): number {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < 1
  ) {
    throw new Error(
      `${path} must be a positive revision`,
    )
  }

  return value as number
}

function asDate(
  value: unknown,
  path: string,
): string {
  const parsed =
    asString(value, path)

  if (
    Number.isNaN(
      Date.parse(parsed),
    )
  ) {
    throw new Error(
      `${path} must be an ISO date`,
    )
  }

  return parsed
}

function parseConsequence(
  value: unknown,
): CharacterBlushOfLifeConsequence {
  const parsed =
    asRecord(
      value,
      'response.rouse.consequence',
    )

  if (
    parsed.kind === 'none'
  ) {
    return { kind: 'none' }
  }

  if (
    parsed.kind ===
      'torporTriggered'
  ) {
    return {
      kind:
        'torporTriggered',
    }
  }

  if (
    parsed.kind ===
      'hungerFrenzyTestRequired' &&
    parsed.difficulty === 4
  ) {
    return {
      kind:
        'hungerFrenzyTestRequired',
      difficulty: 4,
    }
  }

  throw new Error(
    'response.rouse.consequence is invalid',
  )
}

function parseRouse(
  value: unknown,
): CharacterBlushOfLifeRouseResult {
  const parsed =
    asRecord(
      value,
      'response.rouse',
    )

  if (
    parsed.reason !==
      'blushOfLife'
  ) {
    throw new Error(
      'response.rouse.reason must be blushOfLife',
    )
  }

  if (
    !Array.isArray(
      parsed.rolls,
    ) ||
    parsed.rolls.length < 1 ||
    parsed.rolls.length > 2 ||
    parsed.rolls.some(
      (roll) =>
        !Number.isInteger(roll) ||
        roll < 1 ||
        roll > 10,
    )
  ) {
    throw new Error(
      'response.rouse.rolls must contain one or two d10',
    )
  }

  if (
    !Number.isInteger(
      parsed.selectedResult,
    ) ||
    (parsed.selectedResult as number) <
      1 ||
    (parsed.selectedResult as number) >
      10 ||
    !parsed.rolls.includes(
      parsed.selectedResult,
    )
  ) {
    throw new Error(
      'response.rouse.selectedResult is invalid',
    )
  }

  if (
    typeof parsed.success !==
      'boolean'
  ) {
    throw new Error(
      'response.rouse.success must be boolean',
    )
  }

  return {
    operationId:
      asUuid(
        parsed.operationId,
        'response.rouse.operationId',
      ),
    reason: 'blushOfLife',
    rolls:
      parsed.rolls as number[],
    selectedResult:
      parsed.selectedResult as number,
    success:
      parsed.success,
    hungerBefore:
      asHunger(
        parsed.hungerBefore,
        'response.rouse.hungerBefore',
      ),
    hungerAfter:
      asHunger(
        parsed.hungerAfter,
        'response.rouse.hungerAfter',
      ),
    consequence:
      parseConsequence(
        parsed.consequence,
      ),
    rollHistoryId:
      asUuid(
        parsed.rollHistoryId,
        'response.rouse.rollHistoryId',
      ),
    characterRevision:
      asRevision(
        parsed.characterRevision,
        'response.rouse.characterRevision',
      ),
    createdAt:
      asDate(
        parsed.createdAt,
        'response.rouse.createdAt',
      ),
  }
}

export function parseCharacterBlushOfLifeResult(
  value: unknown,
): CharacterBlushOfLifeResult {
  const parsed =
    asRecord(value, 'response')

  if (
    parsed.outcome ===
      'rouseResolved'
  ) {
    return {
      outcome:
        'rouseResolved',
      rouse:
        parseRouse(
          parsed.rouse,
        ),
    }
  }

  if (
    parsed.outcome !==
      'rouseExempted'
  ) {
    throw new Error(
      'response.outcome is invalid',
    )
  }

  const exemption =
    asRecord(
      parsed.exemption,
      'response.exemption',
    )

  if (
    exemption.source !==
      'dyscrasia'
  ) {
    throw new Error(
      'response.exemption.source must be dyscrasia',
    )
  }

  const hungerBefore =
    asHunger(
      parsed.hungerBefore,
      'response.hungerBefore',
    )

  const hungerAfter =
    asHunger(
      parsed.hungerAfter,
      'response.hungerAfter',
    )

  if (
    hungerBefore !==
      hungerAfter
  ) {
    throw new Error(
      'rouseExempted must preserve Hunger',
    )
  }

  return {
    outcome:
      'rouseExempted',
    operationId:
      asUuid(
        parsed.operationId,
        'response.operationId',
      ),
    exemption: {
      source:
        'dyscrasia',
      dyscrasiaKey:
        asString(
          exemption.dyscrasiaKey,
          'response.exemption.dyscrasiaKey',
        ),
      sourceBloodOperationId:
        asUuid(
          exemption.sourceBloodOperationId,
          'response.exemption.sourceBloodOperationId',
        ),
    },
    hungerBefore,
    hungerAfter,
    characterRevision:
      asRevision(
        parsed.characterRevision,
        'response.characterRevision',
      ),
    createdAt:
      asDate(
        parsed.createdAt,
        'response.createdAt',
      ),
  }
}

function parseError(
  value: unknown,
): {
  readonly code: string | null
  readonly violations:
    readonly unknown[] | null
} {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return {
      code: null,
      violations: null,
    }
  }

  const parsed =
    value as UnknownRecord

  return {
    code:
      typeof parsed.code ===
        'string'
        ? parsed.code
        : null,
    violations:
      Array.isArray(
        parsed.violations,
      )
        ? parsed.violations
        : null,
  }
}

export function createCharacterBlushOfLifeOperationId(
  cryptoApi:
    Pick<
      Crypto,
      'randomUUID' | 'getRandomValues'
    > = globalThis.crypto,
): string {
  if (
    typeof cryptoApi.randomUUID ===
      'function'
  ) {
    return cryptoApi.randomUUID()
  }

  const bytes =
    new Uint8Array(16)

  cryptoApi.getRandomValues(bytes)

  bytes[6] =
    (bytes[6] & 0x0f) | 0x40
  bytes[8] =
    (bytes[8] & 0x3f) | 0x80

  const hex =
    Array.from(
      bytes,
      (value) =>
        value
          .toString(16)
          .padStart(2, '0'),
    )

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-')
}

export function createCharacterBlushOfLifeGateway(
  fetchApi:
    typeof globalThis.fetch =
      globalThis.fetch,
): CharacterBlushOfLifeGateway {
  return {
    async useBlushOfLife(
      characterId:
        string,
      request:
        CharacterBlushOfLifeRequest,
    ) {
      let response: Response

      try {
        response =
          await fetchApi(
            `/api/characters/${encodeURIComponent(characterId)}/blood/blush-of-life`,
            {
              method: 'POST',
              credentials:
                'include',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body:
                JSON.stringify(
                  request,
                ),
            },
          )
      } catch {
        throw new CharacterBlushOfLifeApiError(
          0,
          null,
        )
      }

      let payload: unknown =
        null

      try {
        payload =
          await response.json()
      } catch {
        payload = null
      }

      if (!response.ok) {
        const error =
          parseError(payload)

        throw new CharacterBlushOfLifeApiError(
          response.status,
          error.code,
          error.violations,
        )
      }

      return parseCharacterBlushOfLifeResult(
        payload,
      )
    },
  }
}
