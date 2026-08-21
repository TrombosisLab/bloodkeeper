import type {
  CharacterAdvancementPreview,
  CharacterAdvancementRequest,
} from '../domain/character-advancement.types'
import type {
  PersistedCharacterAdvantageDetails,
} from '../domain/persisted-character.types'
import type {
  PurchaseCharacterAdvancementCommand,
} from '../application/purchase-character-advancement.use-case'

type UnknownRecord = Record<string, unknown>

export class InvalidCharacterAdvancementRequestError extends Error {
  constructor(path: string, expectation: string) {
    super(`${path} ${expectation}`)
    this.name = 'InvalidCharacterAdvancementRequestError'
  }
}

function record(value: unknown): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InvalidCharacterAdvancementRequestError('body', 'must be an object')
  }
  return value as UnknownRecord
}

function text(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new InvalidCharacterAdvancementRequestError(path, 'must be a non-empty string')
  }
  return value.trim()
}

function only(body: UnknownRecord, keys: readonly string[]): void {
  const allowed = new Set(keys)
  for (const key of Object.keys(body)) {
    if (!allowed.has(key)) throw new InvalidCharacterAdvancementRequestError(`body.${key}`, 'is not allowed')
  }
}


function integer(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    throw new InvalidCharacterAdvancementRequestError(path, 'must be an integer')
  }
  return value
}

function nullableText(value: unknown, path: string): string | null {
  return value === null ? null : text(value, path)
}

function optionalText(body: UnknownRecord, key: string, path: string): string | undefined {
  return Object.hasOwn(body, key) ? text(body[key], `${path}.${key}`) : undefined
}

function details(input: unknown): PersistedCharacterAdvantageDetails | null {
  if (input === null) return null
  const value = record(input)
  const kind = text(value.kind, 'body.advancement.details.kind')
  const path = 'body.advancement.details'
  const identityKinds = ['contact', 'retainer', 'mawla', 'herd', 'haven', 'famousFace', 'enemy', 'stalker']
  const sphereKinds = ['status', 'fame', 'influence']
  const descriptionKinds = ['infamy', 'despised', 'hatred', 'exiled', 'suspect', 'shunned', 'mortalPretender']

  if (kind === 'allies') {
    only(value, ['kind', 'effectiveness', 'reliability', 'identity'])
    return { kind, effectiveness: integer(value.effectiveness, `${path}.effectiveness`), reliability: integer(value.reliability, `${path}.reliability`), ...(optionalText(value, 'identity', path) === undefined ? {} : { identity: optionalText(value, 'identity', path) }) }
  }
  if (identityKinds.includes(kind)) {
    only(value, ['kind', 'identity'])
    return { kind, ...(optionalText(value, 'identity', path) === undefined ? {} : { identity: optionalText(value, 'identity', path) }) } as PersistedCharacterAdvantageDetails
  }
  if (sphereKinds.includes(kind)) {
    only(value, ['kind', 'sphere'])
    return { kind, ...(optionalText(value, 'sphere', path) === undefined ? {} : { sphere: optionalText(value, 'sphere', path) }) } as PersistedCharacterAdvantageDetails
  }
  if (kind === 'mask') {
    only(value, ['kind', 'identity', 'benefits'])
    if (!Array.isArray(value.benefits) || value.benefits.some((item) => item !== 'erased' && item !== 'tailor')) throw new InvalidCharacterAdvancementRequestError(`${path}.benefits`, 'must contain canonical Mask benefits')
    return { kind, benefits: [...value.benefits], ...(optionalText(value, 'identity', path) === undefined ? {} : { identity: optionalText(value, 'identity', path) }) }
  }
  if (kind === 'darkSecret') { only(value, ['kind', 'secret']); return { kind, ...(optionalText(value, 'secret', path) === undefined ? {} : { secret: optionalText(value, 'secret', path) }) } }
  if (kind === 'resources') { only(value, ['kind', 'source']); return { kind, ...(optionalText(value, 'source', path) === undefined ? {} : { source: optionalText(value, 'source', path) }) } }
  if (kind === 'substanceUse') { only(value, ['kind', 'substance', 'poolCategory']); return { kind, substance: text(value.substance, `${path}.substance`), ...(optionalText(value, 'poolCategory', path) === undefined ? {} : { poolCategory: optionalText(value, 'poolCategory', path) }) } }
  if (kind === 'folkloricBane') { only(value, ['kind', 'source']); return { kind, source: text(value.source, `${path}.source`) } }
  if (kind === 'folkloricBlock') { only(value, ['kind', 'taboo']); return { kind, taboo: text(value.taboo, `${path}.taboo`) } }
  if (kind === 'preyExclusion') { only(value, ['kind', 'excludedPrey']); return { kind, excludedPrey: text(value.excludedPrey, `${path}.excludedPrey`) } }
  if (kind === 'loresheet') { only(value, ['kind', 'loresheetKey', 'benefitKey']); return { kind, loresheetKey: text(value.loresheetKey, `${path}.loresheetKey`), benefitKey: text(value.benefitKey, `${path}.benefitKey`) } }
  if (kind === 'linguistics') {
    only(value, ['kind', 'languages'])
    if (!Array.isArray(value.languages)) throw new InvalidCharacterAdvancementRequestError(`${path}.languages`, 'must be an array')
    return { kind, languages: value.languages.map((item, index) => text(item, `${path}.languages[${index}]`)) }
  }
  if (kind === 'methuselahVisage') { only(value, ['kind', 'resembles']); return { kind, ...(optionalText(value, 'resembles', path) === undefined ? {} : { resembles: optionalText(value, 'resembles', path) }) } }
  if (kind === 'childOfTheScene') { only(value, ['kind', 'subculture']); return { kind, ...(optionalText(value, 'subculture', path) === undefined ? {} : { subculture: optionalText(value, 'subculture', path) }) } }
  if (descriptionKinds.includes(kind)) {
    only(value, ['kind', 'description'])
    return { kind, ...(optionalText(value, 'description', path) === undefined ? {} : { description: optionalText(value, 'description', path) }) } as PersistedCharacterAdvantageDetails
  }
  throw new InvalidCharacterAdvancementRequestError(`${path}.kind`, 'is not supported')
}

function uuid(value: unknown, path: string): string {
  const parsed = text(value, path)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed)) {
    throw new InvalidCharacterAdvancementRequestError(path, 'must be a UUID')
  }
  return parsed.toLowerCase()
}

export function parseCharacterAdvancementRequest(input: unknown): CharacterAdvancementRequest {
  const body = record(input)
  const kind = text(body.kind, 'body.kind')
  if (kind === 'bloodPotency') {
    only(body, ['kind'])
    return { kind }
  }
  if (kind === 'specialty') {
    only(body, ['kind', 'skillKey', 'name'])
    return { kind, skillKey: text(body.skillKey, 'body.skillKey'), name: text(body.name, 'body.name') }
  }
  if (kind === 'discipline') {
    only(body, ['kind', 'disciplineKey', 'powerKey'])
    return { kind, disciplineKey: text(body.disciplineKey, 'body.disciplineKey'), powerKey: text(body.powerKey, 'body.powerKey') }
  }
  if (kind === 'advantage') {
    only(body, ['kind', 'definitionKey', 'selectionId', 'targetRating', 'parentSelectionId', 'details'])
    const rating = body.targetRating
    if (typeof rating !== 'number' || !Number.isSafeInteger(rating) || rating < 1) {
      throw new InvalidCharacterAdvancementRequestError('body.targetRating', 'must be a positive integer')
    }
    const selectionId = body.selectionId === undefined || body.selectionId === null
      ? null
      : text(body.selectionId, 'body.selectionId')
    return {
      kind,
      definitionKey: text(body.definitionKey, 'body.definitionKey'),
      selectionId,
      targetRating: rating,
      ...(Object.hasOwn(body, 'parentSelectionId')
        ? { parentSelectionId: nullableText(body.parentSelectionId, 'body.parentSelectionId') }
        : {}),
      ...(Object.hasOwn(body, 'details') ? { details: details(body.details) } : {}),
    }
  }
  if (['attribute', 'skill', 'ritual', 'formula', 'ceremony'].includes(kind)) {
    only(body, ['kind', 'key'])
    return { kind, key: text(body.key, 'body.key') } as CharacterAdvancementRequest
  }
  throw new InvalidCharacterAdvancementRequestError('body.kind', 'is not supported')
}

export type CharacterAdvancementPreviewResponseDto = CharacterAdvancementPreview

export function toCharacterAdvancementPreviewResponse(
  preview: CharacterAdvancementPreview,
): CharacterAdvancementPreviewResponseDto {
  return preview
}


export function parseCharacterAdvancementPurchase(
  input: unknown,
  characterId: string,
): PurchaseCharacterAdvancementCommand {
  const body = record(input)
  only(
    body,
    [
      'expectedRevision',
      'operationId',
      'advancement',
      'useDyscrasiaExperience',
    ],
  )

  const expectedRevision =
    integer(
      body.expectedRevision,
      'body.expectedRevision',
    )

  if (expectedRevision < 1) {
    throw new InvalidCharacterAdvancementRequestError(
      'body.expectedRevision',
      'must be positive',
    )
  }

  if (
    Object.hasOwn(
      body,
      'useDyscrasiaExperience',
    ) &&
    typeof body.useDyscrasiaExperience !==
      'boolean'
  ) {
    throw new InvalidCharacterAdvancementRequestError(
      'body.useDyscrasiaExperience',
      'must be a boolean',
    )
  }

  return {
    characterId,
    expectedRevision,
    operationId:
      uuid(
        body.operationId,
        'body.operationId',
      ),
    advancement:
      parseCharacterAdvancementRequest(
        body.advancement,
      ),
    ...(Object.hasOwn(
      body,
      'useDyscrasiaExperience',
    )
      ? {
          useDyscrasiaExperience:
            body.useDyscrasiaExperience as boolean,
        }
      : {}),
  }
}
