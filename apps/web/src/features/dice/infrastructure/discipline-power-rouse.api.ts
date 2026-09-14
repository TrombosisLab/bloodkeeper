import {
  CharacterRouseCheckApiError,
  parseCharacterRouseCheckResponse,
} from '../../character-sheet/infrastructure/character-rouse-check.api'

import type {
  DisciplinePowerRouseGateway,
  DisciplinePowerRouseProfile,
  DisciplinePowerRouseProfileStatus,
  DisciplinePowerRouseProfilesSnapshot,
  DisciplinePowerRouseCheckRequest,
} from '../types/discipline-power-rouse.types'

type FetchImplementation = typeof globalThis.fetch
type UnknownRecord = Record<string, unknown>

const statuses: readonly DisciplinePowerRouseProfileStatus[] = [
  'unknownPower',
  'inactivePower',
  'notOwned',
  'bloodStateUnavailable',
  'noRouseCheck',
  'ready',
  'contextual',
]

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function integer(value: unknown, min: number): number | null {
  return Number.isSafeInteger(value) && (value as number) >= min
    ? value as number
    : null
}

function nullableInteger(value: unknown, min: number): number | null {
  return value === null ? null : integer(value, min)
}

function stringOrNull(value: unknown): string | null {
  return value === null ? null : typeof value === 'string' ? value : null
}

function parseProfile(value: unknown): DisciplinePowerRouseProfile {
  if (!isRecord(value)) {
    throw new CharacterRouseCheckApiError(
      502,
      'INVALID_DISCIPLINE_POWER_ROUSE_PROFILE_RESPONSE',
    )
  }

  const powerKey = typeof value.powerKey === 'string' && value.powerKey !== ''
    ? value.powerKey
    : null
  const status = typeof value.status === 'string' && statuses.includes(value.status as DisciplinePowerRouseProfileStatus)
    ? value.status as DisciplinePowerRouseProfileStatus
    : null
  const execution = value.execution === 'none' || value.execution === 'singleCheck' || value.execution === 'contextual'
    ? value.execution
    : null
  const level = nullableInteger(value.level, 1)
  const requiredChecks = nullableInteger(value.requiredChecks, 1)
  const dicePerCheck = value.dicePerCheck === null || value.dicePerCheck === 1 || value.dicePerCheck === 2
    ? value.dicePerCheck as 1 | 2 | null
    : null
  const rouseCost = value.rouseCost === null || isRecord(value.rouseCost)
    ? value.rouseCost as Readonly<Record<string, unknown>> | null
    : null
  const exemptions = Array.isArray(value.exemptions) ? value.exemptions : null

  if (
    powerKey === null ||
    status === null ||
    execution === null ||
    (value.level !== null && level === null) ||
    (value.requiredChecks !== null && requiredChecks === null) ||
    (value.dicePerCheck !== null && dicePerCheck === null) ||
    (value.rouseCost !== null && rouseCost === null) ||
    exemptions === null
  ) {
    throw new CharacterRouseCheckApiError(
      502,
      'INVALID_DISCIPLINE_POWER_ROUSE_PROFILE_RESPONSE',
    )
  }

  return {
    powerKey,
    powerName: stringOrNull(value.powerName),
    disciplineKey: stringOrNull(value.disciplineKey),
    level,
    status,
    execution,
    rouseCost,
    requiredChecks,
    dicePerCheck,
    exemptions,
  }
}

function parseSnapshot(value: unknown): DisciplinePowerRouseProfilesSnapshot {
  if (!isRecord(value)) {
    throw new CharacterRouseCheckApiError(
      502,
      'INVALID_DISCIPLINE_POWER_ROUSE_PROFILE_RESPONSE',
    )
  }

  const characterId = typeof value.characterId === 'string' && value.characterId !== ''
    ? value.characterId
    : null
  const characterRevision = integer(value.characterRevision, 0)
  const bloodPotency = nullableInteger(value.bloodPotency, 0)
  const profiles = Array.isArray(value.profiles)
    ? value.profiles.map(parseProfile)
    : null

  if (characterId === null || characterRevision === null || bloodPotency === null || profiles === null) {
    throw new CharacterRouseCheckApiError(
      502,
      'INVALID_DISCIPLINE_POWER_ROUSE_PROFILE_RESPONSE',
    )
  }

  return {
    characterId,
    characterRevision,
    bloodPotency,
    profiles,
  }
}

async function responseError(response: Response): Promise<CharacterRouseCheckApiError> {
  let code = 'DISCIPLINE_POWER_ROUSE_REQUEST_FAILED'
  let violations: readonly unknown[] = []

  try {
    const body: unknown = await response.json()
    if (isRecord(body)) {
      if (typeof body.code === 'string') code = body.code
      if (Array.isArray(body.violations)) violations = body.violations
    }
  } catch {
    // El status HTTP sigue siendo útil aunque no haya cuerpo JSON.
  }

  return new CharacterRouseCheckApiError(response.status, code, violations)
}

async function getJson(
  fetchImplementation: FetchImplementation,
  url: string,
): Promise<unknown> {
  let response: Response
  try {
    response = await fetchImplementation(url, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new CharacterRouseCheckApiError(0, 'DISCIPLINE_POWER_ROUSE_NETWORK_ERROR')
  }

  if (!response.ok) throw await responseError(response)
  return response.json()
}

export function createDisciplinePowerRouseGateway(
  fetchImplementation: FetchImplementation = globalThis.fetch,
): DisciplinePowerRouseGateway {
  return {
    async load(characterId: string): Promise<DisciplinePowerRouseProfilesSnapshot> {
      try {
        return parseSnapshot(await getJson(
          fetchImplementation,
          `/api/characters/${encodeURIComponent(characterId)}/blood/discipline-rouse-profiles`,
        ))
      } catch (error: unknown) {
        if (error instanceof CharacterRouseCheckApiError) throw error
        throw new CharacterRouseCheckApiError(502, 'INVALID_DISCIPLINE_POWER_ROUSE_PROFILE_RESPONSE')
      }
    },

    async execute(
      characterId: string,
      request: DisciplinePowerRouseCheckRequest,
    ) {
      let response: Response
      try {
        response = await fetchImplementation(
          `/api/characters/${encodeURIComponent(characterId)}/blood/discipline-rouse-check`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
          },
        )
      } catch {
        throw new CharacterRouseCheckApiError(0, 'DISCIPLINE_POWER_ROUSE_NETWORK_ERROR')
      }

      if (!response.ok) throw await responseError(response)

      try {
        return parseCharacterRouseCheckResponse(await response.json())
      } catch (error: unknown) {
        if (error instanceof CharacterRouseCheckApiError) throw error
        throw new CharacterRouseCheckApiError(502, 'INVALID_CHARACTER_ROUSE_CHECK_RESPONSE')
      }
    },
  }
}

