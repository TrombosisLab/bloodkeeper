import {
  parseCharacterDraftApiSnapshotResponse,
} from '../../character-creation/infrastructure/character-draft.api.ts'

import type {
  CharacterDraftApiSnapshot,
} from '../../character-creation/types/character-draft-api.types.ts'

import {
  characterEmbracePendingDecisions,
} from './character-embrace.api.ts'

export type CharacterInitialVampirePendingDecision =
  typeof characterEmbracePendingDecisions[number]

export interface CharacterInitialVampireResolutionResponse {
  readonly character:
    CharacterDraftApiSnapshot

  readonly pendingDecisions:
    readonly CharacterInitialVampirePendingDecision[]
}

export interface CharacterInitialVampireConsolidationResponse
  extends CharacterInitialVampireResolutionResponse {
  readonly phase: 'ESTABLISHED_VAMPIRE'
}

export interface CharacterInitialVampireApiErrorDetails {
  readonly decision?: unknown
  readonly prerequisite?: unknown
  readonly violations?: unknown
  readonly issues?: unknown
}

export class CharacterInitialVampireApiError
  extends Error {
  readonly status: number
  readonly code: string
  readonly details:
    CharacterInitialVampireApiErrorDetails

  constructor(
    status: number,
    code: string,
    details:
      CharacterInitialVampireApiErrorDetails = {},
  ) {
    super(code)

    this.name =
      'CharacterInitialVampireApiError'

    this.status =
      status

    this.code =
      code

    this.details =
      details
  }
}

type InitialAdvantages =
  CharacterDraftApiSnapshot['advantages']

type InitialThinBloodTraits =
  CharacterDraftApiSnapshot['thinBloodTraits']

type InitialThinBloodAlchemy =
  NonNullable<
    CharacterDraftApiSnapshot['thinBloodAlchemy']
  >

export interface CharacterInitialVampireGateway {
  resolveClan(
    characterId: string,
    expectedRevision: number,
    clanKey: string,
  ): Promise<CharacterInitialVampireResolutionResponse>

  resolveGeneration(
    characterId: string,
    expectedRevision: number,
    generation: number,
  ): Promise<CharacterInitialVampireResolutionResponse>

  establishBlood(
    characterId: string,
    expectedRevision: number,
    bloodPotency: number,
    hunger: number,
  ): Promise<CharacterInitialVampireResolutionResponse>

  manifestDiscipline(
    characterId: string,
    expectedRevision: number,
    disciplineKey: string,
    rating: number,
  ): Promise<CharacterInitialVampireResolutionResponse>

  manifestPower(
    characterId: string,
    expectedRevision: number,
    disciplineKey: string,
    powerKey: string,
  ): Promise<CharacterInitialVampireResolutionResponse>

  reviewAdvantages(
    characterId: string,
    expectedRevision: number,
    advantages: InitialAdvantages,
  ): Promise<CharacterInitialVampireResolutionResponse>

  adoptPredatorType(
    characterId: string,
    expectedRevision: number,
    input: {
      readonly predatorTypeKey: string
      readonly predatorTypeChoices:
        Readonly<Record<string, number>>
      readonly disciplinePowerKey: string
      readonly advantages: InitialAdvantages
    },
  ): Promise<CharacterInitialVampireResolutionResponse>

  resolveThinBloodState(
    characterId: string,
    expectedRevision: number,
    thinBloodTraits: InitialThinBloodTraits,
    thinBloodAlchemy: InitialThinBloodAlchemy,
  ): Promise<CharacterInitialVampireResolutionResponse>

  consolidate(
    characterId: string,
    expectedRevision: number,
  ): Promise<CharacterInitialVampireConsolidationResponse>
}

type FetchImplementation =
  typeof globalThis.fetch

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isPendingDecision(
  value: unknown,
): value is CharacterInitialVampirePendingDecision {
  return (
    typeof value === 'string' &&
    characterEmbracePendingDecisions.includes(
      value as CharacterInitialVampirePendingDecision,
    )
  )
}

function parseResolutionResponse(
  value: unknown,
): CharacterInitialVampireResolutionResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.pendingDecisions) ||
    !value.pendingDecisions.every(
      isPendingDecision,
    )
  ) {
    throw new CharacterInitialVampireApiError(
      502,
      'INVALID_INITIAL_VAMPIRE_RESPONSE',
    )
  }

  let character:
    CharacterDraftApiSnapshot

  try {
    character =
      parseCharacterDraftApiSnapshotResponse(
        value.character,
      )
  } catch {
    throw new CharacterInitialVampireApiError(
      502,
      'INVALID_INITIAL_VAMPIRE_RESPONSE',
    )
  }

  if (
    character.nature !== 'vampire' ||
    character.creation.creationMode !==
      'sessionZero'
  ) {
    throw new CharacterInitialVampireApiError(
      502,
      'INVALID_INITIAL_VAMPIRE_RESPONSE',
    )
  }

  return {
    character,
    pendingDecisions: [
      ...value.pendingDecisions,
    ],
  }
}

export function parseCharacterInitialVampireResolutionResponse(
  value: unknown,
): CharacterInitialVampireResolutionResponse {
  return parseResolutionResponse(value)
}

export function parseCharacterInitialVampireConsolidationResponse(
  value: unknown,
): CharacterInitialVampireConsolidationResponse {
  if (
    !isRecord(value) ||
    value.phase !== 'ESTABLISHED_VAMPIRE'
  ) {
    throw new CharacterInitialVampireApiError(
      502,
      'INVALID_INITIAL_VAMPIRE_RESPONSE',
    )
  }

  return {
    ...parseResolutionResponse(value),
    phase: 'ESTABLISHED_VAMPIRE',
  }
}

async function responseError(
  response: Response,
): Promise<CharacterInitialVampireApiError> {
  let code =
    'INITIAL_VAMPIRE_REQUEST_FAILED'

  let details:
    CharacterInitialVampireApiErrorDetails = {}

  try {
    const body: unknown =
      await response.json()

    if (isRecord(body)) {
      if (typeof body.code === 'string') {
        code = body.code
      }

      details = {
        decision:
          body.decision,
        prerequisite:
          body.prerequisite,
        violations:
          body.violations,
        issues:
          body.issues,
      }
    }
  } catch {
    // El estado HTTP sigue siendo útil sin JSON.
  }

  return new CharacterInitialVampireApiError(
    response.status,
    code,
    details,
  )
}

async function request(
  fetchImplementation: FetchImplementation,
  characterId: string,
  suffix: string,
  body: Readonly<Record<string, unknown>>,
  consolidation = false,
): Promise<
  CharacterInitialVampireResolutionResponse |
  CharacterInitialVampireConsolidationResponse
> {
  let response: Response

  try {
    response =
      await fetchImplementation(
        `/api/characters/${encodeURIComponent(characterId)}/initial-vampire/${suffix}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(body),
        },
      )
  } catch {
    throw new CharacterInitialVampireApiError(
      0,
      'INITIAL_VAMPIRE_NETWORK_ERROR',
    )
  }

  if (!response.ok) {
    throw await responseError(response)
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch {
    throw new CharacterInitialVampireApiError(
      502,
      'INVALID_INITIAL_VAMPIRE_RESPONSE',
    )
  }

  return consolidation
    ? parseCharacterInitialVampireConsolidationResponse(
        payload,
      )
    : parseCharacterInitialVampireResolutionResponse(
        payload,
      )
}

export function createCharacterInitialVampireGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): CharacterInitialVampireGateway {
  return {
    async resolveClan(
      characterId,
      expectedRevision,
      clanKey,
    ) {
      return request(
        fetchImplementation,
        characterId,
        'clan',
        {
          expectedRevision,
          clanKey,
        },
      ) as Promise<CharacterInitialVampireResolutionResponse>
    },

    async resolveGeneration(
      characterId,
      expectedRevision,
      generation,
    ) {
      return request(
        fetchImplementation,
        characterId,
        'generation',
        {
          expectedRevision,
          generation,
        },
      ) as Promise<CharacterInitialVampireResolutionResponse>
    },

    async establishBlood(
      characterId,
      expectedRevision,
      bloodPotency,
      hunger,
    ) {
      return request(
        fetchImplementation,
        characterId,
        'blood',
        {
          expectedRevision,
          bloodPotency,
          hunger,
        },
      ) as Promise<CharacterInitialVampireResolutionResponse>
    },

    async manifestDiscipline(
      characterId,
      expectedRevision,
      disciplineKey,
      rating,
    ) {
      return request(
        fetchImplementation,
        characterId,
        'discipline',
        {
          expectedRevision,
          disciplineKey,
          rating,
        },
      ) as Promise<CharacterInitialVampireResolutionResponse>
    },

    async manifestPower(
      characterId,
      expectedRevision,
      disciplineKey,
      powerKey,
    ) {
      return request(
        fetchImplementation,
        characterId,
        'power',
        {
          expectedRevision,
          disciplineKey,
          powerKey,
        },
      ) as Promise<CharacterInitialVampireResolutionResponse>
    },

    async reviewAdvantages(
      characterId,
      expectedRevision,
      advantages,
    ) {
      return request(
        fetchImplementation,
        characterId,
        'advantages',
        {
          expectedRevision,
          advantages,
        },
      ) as Promise<CharacterInitialVampireResolutionResponse>
    },

    async adoptPredatorType(
      characterId,
      expectedRevision,
      input,
    ) {
      return request(
        fetchImplementation,
        characterId,
        'predator-type',
        {
          expectedRevision,
          predatorTypeKey:
            input.predatorTypeKey,
          predatorTypeChoices:
            input.predatorTypeChoices,
          disciplinePowerKey:
            input.disciplinePowerKey,
          advantages:
            input.advantages,
        },
      ) as Promise<CharacterInitialVampireResolutionResponse>
    },

    async resolveThinBloodState(
      characterId,
      expectedRevision,
      thinBloodTraits,
      thinBloodAlchemy,
    ) {
      return request(
        fetchImplementation,
        characterId,
        'thin-blood',
        {
          expectedRevision,
          thinBloodTraits,
          thinBloodAlchemy,
        },
      ) as Promise<CharacterInitialVampireResolutionResponse>
    },

    async consolidate(
      characterId,
      expectedRevision,
    ) {
      return request(
        fetchImplementation,
        characterId,
        'consolidate',
        {
          expectedRevision,
        },
        true,
      ) as Promise<CharacterInitialVampireConsolidationResponse>
    },
  }
}
