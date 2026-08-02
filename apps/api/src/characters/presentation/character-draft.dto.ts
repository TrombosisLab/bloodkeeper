import {
  CHARACTER_DISCIPLINE_KEYS,
  CHARACTER_SKILL_KEYS,
} from '../domain/persisted-character.types'

import type {
  CreateCharacterDraftData,
  PersistedCharacterDraft,
  UpdateCharacterDraftData,
} from '../domain/persisted-character.types'

type UnknownRecord = Record<string, unknown>

export type CreateCharacterDraftRequestDto = Omit<
  CreateCharacterDraftData,
  'ownerId'
>

export type UpdateCharacterDraftRequestDto = Omit<
  UpdateCharacterDraftData,
  'characterId'
>

export type CharacterDraftResponseDto = Omit<
  PersistedCharacterDraft,
  'createdAt' | 'updatedAt' | 'creation'
> & {
  createdAt: string
  updatedAt: string
  creation: Omit<
    PersistedCharacterDraft['creation'],
    'updatedAt'
  > & {
    updatedAt: string
  }
}

export class InvalidCharacterDraftRequestError
  extends Error {
  constructor(path: string, expectation: string) {
    super(`${path} ${expectation}`)
    this.name = 'InvalidCharacterDraftRequestError'
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function record(
  value: unknown,
  path: string,
): UnknownRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidCharacterDraftRequestError(
      path,
      'must be an object',
    )
  }

  return value as UnknownRecord
}

function onlyKeys(
  value: UnknownRecord,
  keys: readonly string[],
  path: string,
): void {
  const allowed = new Set(keys)

  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new InvalidCharacterDraftRequestError(
        `${path}.${key}`,
        'is not allowed',
      )
    }
  }
}

function required(
  value: UnknownRecord,
  key: string,
  path: string,
): unknown {
  if (!Object.hasOwn(value, key)) {
    throw new InvalidCharacterDraftRequestError(
      `${path}.${key}`,
      'is required',
    )
  }

  return value[key]
}

function stringValue(
  value: unknown,
  path: string,
): asserts value is string {
  if (typeof value !== 'string') {
    throw new InvalidCharacterDraftRequestError(
      path,
      'must be a string',
    )
  }
}

function nullableString(
  value: unknown,
  path: string,
): void {
  if (value !== null) {
    stringValue(value, path)
  }
}

function integer(
  value: unknown,
  path: string,
): asserts value is number {
  if (!Number.isInteger(value)) {
    throw new InvalidCharacterDraftRequestError(
      path,
      'must be an integer',
    )
  }
}

function uuid(value: unknown, path: string): string {
  stringValue(value, path)

  if (!uuidPattern.test(value)) {
    throw new InvalidCharacterDraftRequestError(
      path,
      'must be a UUID',
    )
  }

  return value
}

function oneOf(
  value: unknown,
  allowed: readonly string[],
  path: string,
): void {
  stringValue(value, path)

  if (!allowed.includes(value)) {
    throw new InvalidCharacterDraftRequestError(
      path,
      'contains an unsupported value',
    )
  }
}

function arrayValue(
  value: unknown,
  path: string,
): unknown[] {
  if (!Array.isArray(value)) {
    throw new InvalidCharacterDraftRequestError(
      path,
      'must be an array',
    )
  }

  return value
}

function validateIdentity(
  input: unknown,
  path: string,
): void {
  const value = record(input, path)
  const stringKeys = [
    'name',
    'concept',
    'predatorTypeKey',
    'ambition',
    'clanKey',
    'sire',
    'desire',
  ] as const

  onlyKeys(value, [...stringKeys, 'generation'], path)

  for (const key of stringKeys) {
    if (Object.hasOwn(value, key)) {
      if (key === 'name') {
        stringValue(value[key], `${path}.${key}`)
      } else {
        nullableString(value[key], `${path}.${key}`)
      }
    }
  }

  if (Object.hasOwn(value, 'generation')) {
    const generation = value.generation
    if (generation !== null) {
      integer(generation, `${path}.generation`)
    }
  }
}

function validateIntegerRecord(
  input: unknown,
  keys: readonly string[],
  path: string,
  complete: boolean,
): void {
  const value = record(input, path)
  onlyKeys(value, keys, path)

  for (const key of keys) {
    if (complete || Object.hasOwn(value, key)) {
      integer(
        complete
          ? required(value, key, path)
          : value[key],
        `${path}.${key}`,
      )
    }
  }
}

function validateSpecialties(
  input: unknown,
  path: string,
): void {
  arrayValue(input, path).forEach((item, index) => {
    const itemPath = `${path}[${index}]`
    const value = record(item, itemPath)
    onlyKeys(value, ['id', 'skillKey', 'name', 'origin'], itemPath)
    stringValue(required(value, 'id', itemPath), `${itemPath}.id`)
    oneOf(
      required(value, 'skillKey', itemPath),
      CHARACTER_SKILL_KEYS,
      `${itemPath}.skillKey`,
    )
    stringValue(
      required(value, 'name', itemPath),
      `${itemPath}.name`,
    )
    const origin = required(value, 'origin', itemPath)
    if (origin !== null) {
      oneOf(
        origin,
        ['creation', 'predatorType'],
        `${itemPath}.origin`,
      )
    }
  })
}

function validateDisciplines(
  input: unknown,
  path: string,
): void {
  arrayValue(input, path).forEach((item, index) => {
    const itemPath = `${path}[${index}]`
    const value = record(item, itemPath)
    onlyKeys(
      value,
      ['disciplineKey', 'rating', 'powerKeys', 'origin'],
      itemPath,
    )
    oneOf(
      required(value, 'disciplineKey', itemPath),
      CHARACTER_DISCIPLINE_KEYS,
      `${itemPath}.disciplineKey`,
    )
    integer(
      required(value, 'rating', itemPath),
      `${itemPath}.rating`,
    )
    arrayValue(
      required(value, 'powerKeys', itemPath),
      `${itemPath}.powerKeys`,
    ).forEach((powerKey, powerIndex) =>
      stringValue(
        powerKey,
        `${itemPath}.powerKeys[${powerIndex}]`,
      ),
    )
    const origin = required(value, 'origin', itemPath)
    if (origin !== null) {
      oneOf(
        origin,
        ['creation', 'predatorType', 'thinBlood'],
        `${itemPath}.origin`,
      )
    }
  })
}

function validateKeyList(
  input: unknown,
  key: string,
  path: string,
): void {
  const value = record(input, path)
  onlyKeys(value, [key], path)
  arrayValue(
    required(value, key, path),
    `${path}.${key}`,
  ).forEach((item, index) =>
    stringValue(item, `${path}.${key}[${index}]`),
  )
}

function validateThinBloodAlchemy(
  input: unknown,
  path: string,
): void {
  const value = record(input, path)
  onlyKeys(value, ['rating', 'method', 'formulaKeys'], path)
  integer(required(value, 'rating', path), `${path}.rating`)
  const method = required(value, 'method', path)
  if (method !== null) {
    oneOf(
      method,
      ['athanorCorporis', 'calcinatio', 'fixatio'],
      `${path}.method`,
    )
  }
  arrayValue(
    required(value, 'formulaKeys', path),
    `${path}.formulaKeys`,
  ).forEach((item, index) =>
    stringValue(item, `${path}.formulaKeys[${index}]`),
  )
}

function validateThinBloodTraits(
  input: unknown,
  path: string,
): void {
  arrayValue(input, path).forEach((item, index) => {
    const itemPath = `${path}[${index}]`
    const value = record(item, itemPath)
    onlyKeys(
      value,
      [
        'definitionKey',
        'clanCurseDetails',
        'disciplineAffinityDetails',
      ],
      itemPath,
    )
    stringValue(
      required(value, 'definitionKey', itemPath),
      `${itemPath}.definitionKey`,
    )

    const clanCurse = required(
      value,
      'clanCurseDetails',
      itemPath,
    )
    if (clanCurse !== null) {
      const details = record(
        clanCurse,
        `${itemPath}.clanCurseDetails`,
      )
      onlyKeys(details, ['clanKey'], `${itemPath}.clanCurseDetails`)
      stringValue(
        required(
          details,
          'clanKey',
          `${itemPath}.clanCurseDetails`,
        ),
        `${itemPath}.clanCurseDetails.clanKey`,
      )
    }

    const affinity = required(
      value,
      'disciplineAffinityDetails',
      itemPath,
    )
    if (affinity !== null) {
      const details = record(
        affinity,
        `${itemPath}.disciplineAffinityDetails`,
      )
      onlyKeys(
        details,
        ['disciplineKey', 'powerKey'],
        `${itemPath}.disciplineAffinityDetails`,
      )
      oneOf(
        required(
          details,
          'disciplineKey',
          `${itemPath}.disciplineAffinityDetails`,
        ),
        CHARACTER_DISCIPLINE_KEYS,
        `${itemPath}.disciplineAffinityDetails.disciplineKey`,
      )
      stringValue(
        required(
          details,
          'powerKey',
          `${itemPath}.disciplineAffinityDetails`,
        ),
        `${itemPath}.disciplineAffinityDetails.powerKey`,
      )
    }
  })
}

function validateAdvantageDetails(
  input: unknown,
  path: string,
): void {
  const value = record(input, path)
  const kind = required(value, 'kind', path)
  stringValue(kind, `${path}.kind`)

  const optionalString = (key: string): void => {
    if (Object.hasOwn(value, key)) {
      stringValue(value[key], `${path}.${key}`)
    }
  }

  switch (kind) {
    case 'allies':
      onlyKeys(value, ['kind', 'effectiveness', 'reliability', 'identity'], path)
      integer(required(value, 'effectiveness', path), `${path}.effectiveness`)
      integer(required(value, 'reliability', path), `${path}.reliability`)
      optionalString('identity')
      return
    case 'contact':
    case 'retainer':
    case 'mawla':
    case 'herd':
    case 'haven':
    case 'famousFace':
    case 'enemy':
    case 'stalker':
      onlyKeys(value, ['kind', 'identity'], path)
      optionalString('identity')
      return
    case 'status':
    case 'fame':
    case 'influence':
      onlyKeys(value, ['kind', 'sphere'], path)
      optionalString('sphere')
      return
    case 'mask':
      onlyKeys(value, ['kind', 'identity', 'benefits'], path)
      optionalString('identity')
      arrayValue(
        required(value, 'benefits', path),
        `${path}.benefits`,
      ).forEach((benefit, index) =>
        oneOf(
          benefit,
          ['erased', 'tailor'],
          `${path}.benefits[${index}]`,
        ),
      )
      return
    case 'darkSecret':
      onlyKeys(value, ['kind', 'secret'], path)
      optionalString('secret')
      return
    case 'resources':
    case 'folkloricBane':
      onlyKeys(value, ['kind', 'source'], path)
      if (kind === 'folkloricBane') {
        stringValue(required(value, 'source', path), `${path}.source`)
      } else {
        optionalString('source')
      }
      return
    case 'substanceUse':
      onlyKeys(value, ['kind', 'substance', 'poolCategory'], path)
      stringValue(required(value, 'substance', path), `${path}.substance`)
      optionalString('poolCategory')
      return
    case 'folkloricBlock':
      onlyKeys(value, ['kind', 'taboo'], path)
      stringValue(required(value, 'taboo', path), `${path}.taboo`)
      return
    case 'preyExclusion':
      onlyKeys(value, ['kind', 'excludedPrey'], path)
      stringValue(required(value, 'excludedPrey', path), `${path}.excludedPrey`)
      return
    case 'loresheet':
      onlyKeys(value, ['kind', 'loresheetKey', 'benefitKey'], path)
      stringValue(required(value, 'loresheetKey', path), `${path}.loresheetKey`)
      stringValue(required(value, 'benefitKey', path), `${path}.benefitKey`)
      return
    case 'linguistics':
      onlyKeys(value, ['kind', 'languages'], path)
      arrayValue(required(value, 'languages', path), `${path}.languages`)
        .forEach((language, index) =>
          stringValue(language, `${path}.languages[${index}]`),
        )
      return
    case 'methuselahVisage':
      onlyKeys(value, ['kind', 'resembles'], path)
      optionalString('resembles')
      return
    case 'childOfTheScene':
      onlyKeys(value, ['kind', 'subculture'], path)
      optionalString('subculture')
      return
    case 'infamy':
    case 'despised':
    case 'hatred':
    case 'exiled':
    case 'suspect':
    case 'shunned':
    case 'mortalPretender':
      onlyKeys(value, ['kind', 'description'], path)
      optionalString('description')
      return
    default:
      throw new InvalidCharacterDraftRequestError(
        `${path}.kind`,
        'contains an unsupported value',
      )
  }
}

function validateAdvantages(
  input: unknown,
  path: string,
): void {
  const value = record(input, path)
  onlyKeys(value, ['selections'], path)
  arrayValue(
    required(value, 'selections', path),
    `${path}.selections`,
  ).forEach((item, index) => {
    const itemPath = `${path}.selections[${index}]`
    const selection = record(item, itemPath)
    onlyKeys(
      selection,
      [
        'selectionId',
        'definitionKey',
        'category',
        'rating',
        'origin',
        'parentSelectionId',
        'details',
      ],
      itemPath,
    )
    stringValue(required(selection, 'selectionId', itemPath), `${itemPath}.selectionId`)
    stringValue(required(selection, 'definitionKey', itemPath), `${itemPath}.definitionKey`)
    oneOf(required(selection, 'category', itemPath), ['merit', 'background', 'flaw'], `${itemPath}.category`)
    integer(required(selection, 'rating', itemPath), `${itemPath}.rating`)
    oneOf(required(selection, 'origin', itemPath), ['creation', 'predatorType', 'thinBlood'], `${itemPath}.origin`)
    nullableString(required(selection, 'parentSelectionId', itemPath), `${itemPath}.parentSelectionId`)
    const details = required(selection, 'details', itemPath)
    if (details !== null) {
      validateAdvantageDetails(details, `${itemPath}.details`)
    }
  })
}

function validateHumanity(
  input: unknown,
  path: string,
): void {
  const value = record(input, path)
  onlyKeys(value, ['value', 'convictions', 'touchstones'], path)
  integer(required(value, 'value', path), `${path}.value`)

  arrayValue(required(value, 'convictions', path), `${path}.convictions`)
    .forEach((item, index) => {
      const itemPath = `${path}.convictions[${index}]`
      const conviction = record(item, itemPath)
      onlyKeys(conviction, ['convictionId', 'text', 'touchstoneId'], itemPath)
      stringValue(required(conviction, 'convictionId', itemPath), `${itemPath}.convictionId`)
      stringValue(required(conviction, 'text', itemPath), `${itemPath}.text`)
      nullableString(required(conviction, 'touchstoneId', itemPath), `${itemPath}.touchstoneId`)
    })

  arrayValue(required(value, 'touchstones', path), `${path}.touchstones`)
    .forEach((item, index) => {
      const itemPath = `${path}.touchstones[${index}]`
      const touchstone = record(item, itemPath)
      onlyKeys(touchstone, ['touchstoneId', 'name', 'relationship'], itemPath)
      stringValue(required(touchstone, 'touchstoneId', itemPath), `${itemPath}.touchstoneId`)
      stringValue(required(touchstone, 'name', itemPath), `${itemPath}.name`)
      stringValue(required(touchstone, 'relationship', itemPath), `${itemPath}.relationship`)
    })
}

function validateCreation(
  input: unknown,
  path: string,
  complete: boolean,
): void {
  const value = record(input, path)
  onlyKeys(value, ['currentStep', 'skillDistributionMethod'], path)

  if (complete || Object.hasOwn(value, 'currentStep')) {
    oneOf(
      complete ? required(value, 'currentStep', path) : value.currentStep,
      ['identity', 'attributes', 'skills', 'blood', 'disciplines', 'advantages', 'humanity', 'review'],
      `${path}.currentStep`,
    )
  }

  if (complete || Object.hasOwn(value, 'skillDistributionMethod')) {
    oneOf(
      complete
        ? required(value, 'skillDistributionMethod', path)
        : value.skillDistributionMethod,
      ['generalist', 'balanced', 'specialist'],
      `${path}.skillDistributionMethod`,
    )
  }
}

const attributes = [
  'strength', 'dexterity', 'stamina',
  'charisma', 'manipulation', 'composure',
  'intelligence', 'wits', 'resolve',
] as const

function validateCreateBody(input: unknown): void {
  const value = record(input, 'body')
  const keys = [
    'chronicleId', 'identity', 'attributes', 'blood',
    'skills', 'skillSpecialties', 'disciplines',
    'bloodSorceryRituals', 'oblivionCeremonies',
    'thinBloodAlchemy', 'thinBloodTraits', 'advantages',
    'humanity', 'creation',
  ] as const
  onlyKeys(value, keys, 'body')
  keys.forEach((key) => required(value, key, 'body'))

  const chronicleId = value.chronicleId
  if (chronicleId !== null) {
    uuid(chronicleId, 'body.chronicleId')
  }
  validateIdentity(value.identity, 'body.identity')
  validateIntegerRecord(value.attributes, attributes, 'body.attributes', true)
  validateIntegerRecord(value.blood, ['bloodPotency', 'hunger'], 'body.blood', true)
  validateIntegerRecord(value.skills, CHARACTER_SKILL_KEYS, 'body.skills', true)
  validateSpecialties(value.skillSpecialties, 'body.skillSpecialties')
  validateDisciplines(value.disciplines, 'body.disciplines')
  validateKeyList(value.bloodSorceryRituals, 'ritualKeys', 'body.bloodSorceryRituals')
  validateKeyList(value.oblivionCeremonies, 'ceremonyKeys', 'body.oblivionCeremonies')
  validateThinBloodAlchemy(value.thinBloodAlchemy, 'body.thinBloodAlchemy')
  validateThinBloodTraits(value.thinBloodTraits, 'body.thinBloodTraits')
  validateAdvantages(value.advantages, 'body.advantages')
  validateHumanity(value.humanity, 'body.humanity')
  validateCreation(value.creation, 'body.creation', true)
}

export function parseCreateCharacterDraftRequest(
  ownerIdInput: unknown,
  input: unknown,
): CreateCharacterDraftData {
  const ownerId =
    parseCharacterDraftOwnerId(ownerIdInput)
  validateCreateBody(input)

  return {
    ownerId,
    ...(input as CreateCharacterDraftRequestDto),
  }
}

export function parseCharacterDraftOwnerId(
  ownerIdInput: unknown,
): string {
  return uuid(ownerIdInput, 'ownerId')
}

export function parseCharacterDraftIdParam(
  characterIdInput: unknown,
): string {
  return uuid(characterIdInput, 'characterId')
}

export function parseUpdateCharacterDraftRequest(
  characterIdInput: unknown,
  input: unknown,
): UpdateCharacterDraftData {
  const characterId = uuid(characterIdInput, 'characterId')
  const value = record(input, 'body')
  const keys = [
    'expectedRevision', 'chronicleId', 'identity',
    'attributes', 'blood', 'skills', 'skillSpecialties',
    'disciplines', 'bloodSorceryRituals',
    'oblivionCeremonies', 'thinBloodAlchemy',
    'thinBloodTraits', 'advantages', 'humanityValue',
    'humanityNarrative', 'creation',
  ] as const
  onlyKeys(value, keys, 'body')
  integer(required(value, 'expectedRevision', 'body'), 'body.expectedRevision')

  if (Object.hasOwn(value, 'chronicleId')) {
    if (value.chronicleId !== null) {
      uuid(value.chronicleId, 'body.chronicleId')
    }
  }
  if (Object.hasOwn(value, 'identity')) validateIdentity(value.identity, 'body.identity')
  if (Object.hasOwn(value, 'attributes')) validateIntegerRecord(value.attributes, attributes, 'body.attributes', false)
  if (Object.hasOwn(value, 'blood')) validateIntegerRecord(value.blood, ['bloodPotency', 'hunger'], 'body.blood', false)
  if (Object.hasOwn(value, 'skills')) validateIntegerRecord(value.skills, CHARACTER_SKILL_KEYS, 'body.skills', false)
  if (Object.hasOwn(value, 'skillSpecialties')) validateSpecialties(value.skillSpecialties, 'body.skillSpecialties')
  if (Object.hasOwn(value, 'disciplines')) validateDisciplines(value.disciplines, 'body.disciplines')
  if (Object.hasOwn(value, 'bloodSorceryRituals')) validateKeyList(value.bloodSorceryRituals, 'ritualKeys', 'body.bloodSorceryRituals')
  if (Object.hasOwn(value, 'oblivionCeremonies')) validateKeyList(value.oblivionCeremonies, 'ceremonyKeys', 'body.oblivionCeremonies')
  if (Object.hasOwn(value, 'thinBloodAlchemy')) validateThinBloodAlchemy(value.thinBloodAlchemy, 'body.thinBloodAlchemy')
  if (Object.hasOwn(value, 'thinBloodTraits')) validateThinBloodTraits(value.thinBloodTraits, 'body.thinBloodTraits')
  if (Object.hasOwn(value, 'advantages')) validateAdvantages(value.advantages, 'body.advantages')
  if (Object.hasOwn(value, 'humanityValue')) integer(value.humanityValue, 'body.humanityValue')
  if (Object.hasOwn(value, 'humanityNarrative')) {
    const narrative = record(value.humanityNarrative, 'body.humanityNarrative')
    onlyKeys(narrative, ['convictions', 'touchstones'], 'body.humanityNarrative')
    validateHumanity(
      {
        value: 0,
        convictions: required(narrative, 'convictions', 'body.humanityNarrative'),
        touchstones: required(narrative, 'touchstones', 'body.humanityNarrative'),
      },
      'body.humanityNarrative',
    )
  }
  if (Object.hasOwn(value, 'creation')) validateCreation(value.creation, 'body.creation', false)

  return {
    characterId,
    ...(input as UpdateCharacterDraftRequestDto),
  }
}

export function toCharacterDraftResponse(
  draft: PersistedCharacterDraft,
): CharacterDraftResponseDto {
  return {
    ...draft,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
    creation: {
      ...draft.creation,
      updatedAt: draft.creation.updatedAt.toISOString(),
    },
  }
}
