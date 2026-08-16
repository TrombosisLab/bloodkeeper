import {
  skillKeys,
} from '../data/skill-definitions.ts'

import {
  disciplineKeys,
} from '../data/discipline-definitions.ts'

import type {
  CharacterDraftApiSnapshot,
  CreateCharacterDraftApiRequest,
  UpdateCharacterDraftApiRequest,
  UpdateCharacterChronicleAssociationApiRequest,
} from '../types/character-draft-api.types.ts'

type FetchImplementation =
  typeof globalThis.fetch

type UnknownRecord =
  Record<string, unknown>

const attributeKeys = [
  'strength',
  'dexterity',
  'stamina',
  'charisma',
  'manipulation',
  'composure',
  'intelligence',
  'wits',
  'resolve',
] as const


const creationSteps = [
  'identity',
  'attributes',
  'skills',
  'blood',
  'disciplines',
  'advantages',
  'humanity',
  'review',
] as const

const skillDistributionMethods = [
  'generalist',
  'balanced',
  'specialist',
] as const

const lifecycleStatuses = [
  'draft',
  'active',
  'archived',
] as const

const characterNatures = [
  'human',
  'vampire',
] as const

const creationModes = [
  'standard',
  'sessionZero',
] as const

const ageCategories = [
  'fledgling',
  'neonate',
  'ancilla',
  'elder',
] as const

const skillSpecialtyOrigins = [
  'creation',
  'predatorType',
  'evolution',
] as const

const disciplineOrigins = [
  'creation',
  'predatorType',
  'thinBlood',
  'evolution',
] as const

const advantageCategories = [
  'merit',
  'background',
  'flaw',
] as const

const advantageOrigins = [
  'creation',
  'predatorType',
  'thinBlood',
  'evolution',
] as const

const alchemyMethods = [
  'athanorCorporis',
  'calcinatio',
  'fixatio',
] as const

export class CharacterDraftApiError
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
    this.name = 'CharacterDraftApiError'
    this.status = status
    this.code = code
    this.violations = [...violations]
  }
}

export interface CharacterDraftListQuery {
  readonly limit?: number
  readonly offset?: number
}

export interface CharacterDraftApiPage {
  readonly items:
    readonly CharacterDraftApiSnapshot[]
  readonly nextOffset: number | null
}

export interface CharacterDraftGateway {
  list(): Promise<
    readonly CharacterDraftApiSnapshot[]
  >

  listPage(
    query?: CharacterDraftListQuery,
  ): Promise<CharacterDraftApiPage>

  create(
    request: CreateCharacterDraftApiRequest,
  ): Promise<CharacterDraftApiSnapshot>

  load(
    characterId: string,
  ): Promise<CharacterDraftApiSnapshot>

  update(
    characterId: string,
    request: UpdateCharacterDraftApiRequest,
  ): Promise<CharacterDraftApiSnapshot>

  updateChronicleAssociation(
    characterId: string,
    request:
      UpdateCharacterChronicleAssociationApiRequest,
  ): Promise<CharacterDraftApiSnapshot>
}

function isRecord(
  value: unknown,
): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function isInteger(
  value: unknown,
): value is number {
  return Number.isSafeInteger(value)
}

function isStringOrNull(
  value: unknown,
): value is string | null {
  return (
    value === null ||
    typeof value === 'string'
  )
}

function oneOf(
  value: unknown,
  allowed: readonly string[],
): value is string {
  return (
    typeof value === 'string' &&
    allowed.includes(value)
  )
}

function validTimestamp(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    !Number.isNaN(Date.parse(value))
  )
}

function validIntegerRecord(
  value: unknown,
  keys: readonly string[],
): boolean {
  if (!isRecord(value)) return false

  const actualKeys = Object.keys(value)

  return (
    actualKeys.length === keys.length &&
    keys.every(
      (key) =>
        Object.hasOwn(value, key) &&
        isInteger(value[key]),
    )
  )
}

function validStringArray(
  value: unknown,
): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'string',
    )
  )
}

function validIdentity(
  value: unknown,
): boolean {
  if (!isRecord(value)) return false

  return (
    typeof value.name === 'string' &&
    isStringOrNull(value.concept) &&
    isStringOrNull(value.predatorTypeKey) &&
    isStringOrNull(value.ambition) &&
    isStringOrNull(value.clanKey) &&
    isStringOrNull(value.sire) &&
    isStringOrNull(value.desire) &&
    (
      value.generation === null ||
      isInteger(value.generation)
    ) &&
    (
      value.ageCategory === undefined ||
      value.ageCategory === null ||
      oneOf(
        value.ageCategory,
        ageCategories,
      )
    )
  )
}

function validPredatorTypeChoices(
  value: unknown,
): boolean {
  if (!isRecord(value)) return false

  return Object.entries(value).every(
    ([choiceId, optionIndex]) =>
      choiceId.trim().length > 0 &&
      isInteger(optionIndex) &&
      optionIndex >= 0,
  )
}

function validCreation(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    isInteger(value.schemaVersion) &&
    value.schemaVersion >= 1 &&
    oneOf(value.currentStep, creationSteps) &&
    (
      value.creationMode === undefined ||
      oneOf(value.creationMode, creationModes)
    ) &&
    oneOf(
      value.skillDistributionMethod,
      skillDistributionMethods,
    ) &&
    validPredatorTypeChoices(
      value.predatorTypeChoices,
    ) &&
    validTimestamp(value.updatedAt)
  )
}

function validBlood(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    isInteger(value.bloodPotency) &&
    isInteger(value.hunger)
  )
}

function validDamageTrack(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    isInteger(value.superficial) &&
    isInteger(value.aggravated)
  )
}

function validDamage(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    validDamageTrack(value.health) &&
    validDamageTrack(value.willpower)
  )
}

function validSpecialties(
  value: unknown,
): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        typeof item.id === 'string' &&
        oneOf(item.skillKey, skillKeys) &&
        typeof item.name === 'string' &&
        (
          item.origin === null ||
          oneOf(
            item.origin,
            skillSpecialtyOrigins,
          )
        ),
    )
  )
}

function validDisciplines(
  value: unknown,
): boolean {
  if (!Array.isArray(value)) return false

  const disciplineIdentities: string[] = []
  const powerIdentities: string[] = []

  for (const item of value) {
    if (
      !isRecord(item) ||
      !oneOf(
        item.disciplineKey,
        disciplineKeys,
      ) ||
      !isInteger(item.rating) ||
      !validStringArray(item.powerKeys) ||
      !(
        item.origin === null ||
        oneOf(item.origin, disciplineOrigins)
      )
    ) {
      return false
    }

    disciplineIdentities.push(
      [
        item.disciplineKey,
        item.origin ?? 'unspecified',
      ].join(':'),
    )
    powerIdentities.push(
      ...item.powerKeys,
    )
  }

  return (
    new Set(disciplineIdentities).size ===
      disciplineIdentities.length &&
    new Set(powerIdentities).size ===
      powerIdentities.length
  )
}

function validKeyList(
  value: unknown,
  key: string,
): boolean {
  return (
    isRecord(value) &&
    validStringArray(value[key])
  )
}

function validAlchemy(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    isInteger(value.rating) &&
    (
      value.method === null ||
      oneOf(value.method, alchemyMethods)
    ) &&
    validStringArray(value.formulaKeys)
  )
}

function validThinBloodTraits(
  value: unknown,
): boolean {
  return (
    Array.isArray(value) &&
    value.every((item) => {
      if (
        !isRecord(item) ||
        typeof item.definitionKey !== 'string'
      ) {
        return false
      }

      const clanCurse =
        item.clanCurseDetails
      const affinity =
        item.disciplineAffinityDetails

      const clanCurseValid =
        clanCurse === null ||
        (
          isRecord(clanCurse) &&
          typeof clanCurse.clanKey === 'string'
        )

      const affinityValid =
        affinity === null ||
        (
          isRecord(affinity) &&
          oneOf(
            affinity.disciplineKey,
            disciplineKeys,
          ) &&
          typeof affinity.powerKey === 'string'
        )

      return (
        clanCurseValid &&
        affinityValid
      )
    })
  )
}

function validAdvantageDetails(
  value: unknown,
): boolean {
  if (!isRecord(value)) return false

  const kind = value.kind
  if (typeof kind !== 'string') return false

  const optionalString = (
    key: string,
  ): boolean =>
    value[key] === undefined ||
    typeof value[key] === 'string'

  switch (kind) {
    case 'allies':
      return (
        isInteger(value.effectiveness) &&
        isInteger(value.reliability) &&
        optionalString('identity')
      )

    case 'contact':
    case 'retainer':
    case 'mawla':
    case 'herd':
    case 'haven':
    case 'famousFace':
    case 'enemy':
    case 'stalker':
      return optionalString('identity')

    case 'status':
    case 'fame':
    case 'influence':
      return optionalString('sphere')

    case 'mask':
      return (
        optionalString('identity') &&
        Array.isArray(value.benefits) &&
        value.benefits.every(
          (benefit) =>
            benefit === 'erased' ||
            benefit === 'tailor',
        )
      )

    case 'darkSecret':
      return optionalString('secret')

    case 'resources':
      return optionalString('source')

    case 'substanceUse':
      return (
        typeof value.substance === 'string' &&
        optionalString('poolCategory')
      )

    case 'folkloricBane':
      return typeof value.source === 'string'

    case 'folkloricBlock':
      return typeof value.taboo === 'string'

    case 'preyExclusion':
      return (
        typeof value.excludedPrey === 'string'
      )

    case 'loresheet':
      return (
        typeof value.loresheetKey === 'string' &&
        typeof value.benefitKey === 'string'
      )

    case 'linguistics':
      return validStringArray(value.languages)

    case 'methuselahVisage':
      return optionalString('resembles')

    case 'childOfTheScene':
      return optionalString('subculture')

    case 'infamy':
    case 'despised':
    case 'hatred':
    case 'exiled':
    case 'suspect':
    case 'shunned':
    case 'mortalPretender':
      return optionalString('description')

    default:
      return false
  }
}

function validAdvantages(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    Array.isArray(value.selections) &&
    value.selections.every((selection) => {
      if (!isRecord(selection)) return false

      return (
        typeof selection.selectionId ===
          'string' &&
        typeof selection.definitionKey ===
          'string' &&
        oneOf(
          selection.category,
          advantageCategories,
        ) &&
        isInteger(selection.rating) &&
        oneOf(
          selection.origin,
          advantageOrigins,
        ) &&
        isStringOrNull(
          selection.parentSelectionId,
        ) &&
        (
          selection.details === null ||
          validAdvantageDetails(
            selection.details,
          )
        )
      )
    })
  )
}

function validHumanity(
  value: unknown,
): boolean {
  return (
    isRecord(value) &&
    isInteger(value.value) &&
    isInteger(value.stains) &&
    Array.isArray(value.convictions) &&
    value.convictions.every(
      (conviction) =>
        isRecord(conviction) &&
        typeof conviction.convictionId ===
          'string' &&
        typeof conviction.text === 'string' &&
        isStringOrNull(
          conviction.touchstoneId,
        ),
    ) &&
    Array.isArray(value.touchstones) &&
    value.touchstones.every(
      (touchstone) =>
        isRecord(touchstone) &&
        typeof touchstone.touchstoneId ===
          'string' &&
        typeof touchstone.name === 'string' &&
        typeof touchstone.relationship ===
          'string',
    )
  )
}

function invalidResponse(): never {
  throw new CharacterDraftApiError(
    502,
    'INVALID_CHARACTER_DRAFT_RESPONSE',
  )
}

export function parseCharacterDraftApiSnapshotResponse(
  value: unknown,
): CharacterDraftApiSnapshot {
  if (
    !isRecord(value) ||
    typeof value.characterId !== 'string' ||
    typeof value.ownerId !== 'string' ||
    !isStringOrNull(value.chronicleId) ||
    !oneOf(value.status, lifecycleStatuses) ||
    !(
      value.nature === undefined ||
      oneOf(value.nature, characterNatures)
    ) ||
    !isInteger(value.revision) ||
    value.revision < 1 ||
    !validTimestamp(value.createdAt) ||
    !validTimestamp(value.updatedAt) ||
    !validIdentity(value.identity) ||
    !validCreation(value.creation) ||
    !validIntegerRecord(
      value.attributes,
      attributeKeys,
    ) ||
    !(
      value.blood === null ||
      validBlood(value.blood)
    ) ||
    !validDamage(value.damage) ||
    !validIntegerRecord(
      value.skills,
      skillKeys,
    ) ||
    !validSpecialties(
      value.skillSpecialties,
    ) ||
    !validDisciplines(value.disciplines) ||
    !validKeyList(
      value.bloodSorceryRituals,
      'ritualKeys',
    ) ||
    !validKeyList(
      value.oblivionCeremonies,
      'ceremonyKeys',
    ) ||
    !(
      value.thinBloodAlchemy === null ||
      validAlchemy(value.thinBloodAlchemy)
    ) ||
    !validThinBloodTraits(
      value.thinBloodTraits,
    ) ||
    !validAdvantages(value.advantages) ||
    !validHumanity(value.humanity)
  ) {
    return invalidResponse()
  }

  const resolvedNature =
    value.nature === undefined
      ? 'vampire'
      : value.nature

  if (
    (
      resolvedNature === 'human' &&
      (
        value.blood !== null ||
        value.thinBloodAlchemy !== null
      )
    ) ||
    (
      resolvedNature === 'vampire' &&
      (
        value.blood === null ||
        value.thinBloodAlchemy === null
      )
    )
  ) {
    return invalidResponse()
  }

  const normalized =
    structuredClone(value)

  if (normalized.nature === undefined) {
    normalized.nature = 'vampire'
  }

  if (
    isRecord(normalized.creation) &&
    normalized.creation.creationMode === undefined
  ) {
    normalized.creation.creationMode =
      'standard'
  }

  return normalized as unknown as CharacterDraftApiSnapshot
}

export function parseCharacterDraftApiListResponse(
  value: unknown,
): readonly CharacterDraftApiSnapshot[] {
  if (!Array.isArray(value)) {
    return invalidResponse()
  }

  return value.map(
    parseCharacterDraftApiSnapshotResponse,
  )
}

export function parseCharacterDraftApiPageResponse(
  value: unknown,
): CharacterDraftApiPage {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    !(
      value.nextOffset === null ||
      (
        isInteger(value.nextOffset) &&
        value.nextOffset >= 0
      )
    )
  ) {
    return invalidResponse()
  }

  return {
    items:
      parseCharacterDraftApiListResponse(
        value.items,
      ),
    nextOffset:
      value.nextOffset,
  }
}

async function responseError(
  response: Response,
): Promise<CharacterDraftApiError> {
  let code =
    'CHARACTER_DRAFT_REQUEST_FAILED'
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
    // El estado HTTP sigue siendo útil sin cuerpo JSON.
  }

  return new CharacterDraftApiError(
    response.status,
    code,
    violations,
  )
}

async function pageFromResponse(
  fetchImplementation:
    FetchImplementation,
  query: CharacterDraftListQuery = {},
): Promise<CharacterDraftApiPage> {
  const limit =
    query.limit ?? 25
  const offset =
    query.offset ?? 0

  const response =
    await fetchImplementation(
      `/api/characters/drafts?limit=${encodeURIComponent(
        String(limit),
      )}&offset=${encodeURIComponent(
        String(offset),
      )}`,
      {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      },
    )

  if (!response.ok) {
    throw await responseError(
      response,
    )
  }

  try {
    return parseCharacterDraftApiPageResponse(
      await response.json(),
    )
  } catch (error: unknown) {
    if (
      error instanceof
        CharacterDraftApiError
    ) {
      throw error
    }

    return invalidResponse()
  }
}

async function snapshotFromResponse(
  response: Response,
): Promise<CharacterDraftApiSnapshot> {
  if (!response.ok) {
    throw await responseError(response)
  }

  try {
    return parseCharacterDraftApiSnapshotResponse(
      await response.json(),
    )
  } catch (error: unknown) {
    if (
      error instanceof CharacterDraftApiError
    ) {
      throw error
    }

    return invalidResponse()
  }
}

export function createCharacterDraftGateway(
  fetchImplementation: FetchImplementation =
    globalThis.fetch,
): CharacterDraftGateway {
  return {
    async list() {
      const response =
        await fetchImplementation(
          '/api/characters/drafts',
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      if (!response.ok) {
        throw await responseError(
          response,
        )
      }

      try {
        const body: unknown =
          await response.json()

        if (Array.isArray(body)) {
          return parseCharacterDraftApiListResponse(
            body,
          )
        }

        const first =
          parseCharacterDraftApiPageResponse(
            body,
          )

        const items = [
          ...first.items,
        ]

        let nextOffset =
          first.nextOffset

        while (nextOffset !== null) {
          const page =
            await pageFromResponse(
              fetchImplementation,
              {
                limit: 50,
                offset: nextOffset,
              },
            )

          items.push(...page.items)
          nextOffset =
            page.nextOffset
        }

        return items
      } catch (error: unknown) {
        if (
          error instanceof
            CharacterDraftApiError
        ) {
          throw error
        }

        return invalidResponse()
      }
    },

    async listPage(query = {}) {
      return pageFromResponse(
        fetchImplementation,
        query,
      )
    },

    async create(request) {
      const response =
        await fetchImplementation(
          '/api/characters/drafts',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return snapshotFromResponse(response)
    },

    async load(characterId) {
      const response =
        await fetchImplementation(
          `/api/characters/drafts/${encodeURIComponent(characterId)}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

      return snapshotFromResponse(response)
    },

    async update(
      characterId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/characters/drafts/${encodeURIComponent(characterId)}`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return snapshotFromResponse(response)
    },

    async updateChronicleAssociation(
      characterId,
      request,
    ) {
      const response =
        await fetchImplementation(
          `/api/characters/drafts/${encodeURIComponent(characterId)}/chronicle`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(request),
          },
        )

      return snapshotFromResponse(response)
    },
  }
}
