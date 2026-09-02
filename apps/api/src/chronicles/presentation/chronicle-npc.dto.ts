import type {
  ChronicleNpc,
  ChronicleNpcDeepProfile,
  CreateChronicleNpcData,
  UpdateChronicleNpcData,
} from '../domain/chronicle-npc.types'

export class InvalidChronicleNpcRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidChronicleNpcRequestError'
  }
}

export interface ChronicleNpcResponseDto {
  readonly id: string
  readonly chronicleId: string
  readonly name: string
  readonly category: string | null
  readonly description: string | null
  readonly narrativeRole: string | null
  readonly notes: string | null
  readonly status: 'active' | 'archived'
  readonly detailLevel: 'simple' | 'deep'
  readonly deepProfile: ChronicleNpcDeepProfile | null
  readonly createdAt: string
  readonly updatedAt: string
}

function record(
  value: unknown,
): Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidChronicleNpcRequestError(
      'body must be an object',
    )
  }

  return value as Record<string, unknown>
}

function uuid(
  value: unknown,
  field: string,
): string {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw new InvalidChronicleNpcRequestError(
      `${field} must be a UUID`,
    )
  }

  return value
}

function requiredText(
  value: unknown,
  field: string,
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new InvalidChronicleNpcRequestError(
      `${field} must be a non-empty string`,
    )
  }

  return value.trim()
}

function optionalText(
  value: unknown,
  field: string,
): string | null {
  if (value === null) {
    return null
  }

  if (typeof value !== 'string') {
    throw new InvalidChronicleNpcRequestError(
      `${field} must be a string or null`,
    )
  }

  const trimmed = value.trim()

  return trimmed.length === 0
    ? null
    : trimmed
}

function profileText(value: Record<string, unknown>, key: string): string | null { return value[key] === undefined ? null : optionalText(value[key], 'body.deepProfile.' + key) }
function profileList(value: Record<string, unknown>, key: string): readonly string[] { const item = value[key]; if (item === undefined) return []; if (!Array.isArray(item) || item.some(entry => typeof entry !== 'string' || entry.trim().length === 0)) throw new InvalidChronicleNpcRequestError('body.deepProfile.' + key + ' must be a list of text'); return [...new Map(item.map(entry => [entry.trim().toLocaleLowerCase('es'), entry.trim()] as const)).values()] }
function profileRating(value: Record<string, unknown>, key: string): number { const item = value[key]; if (item === undefined) return 0; if (typeof item !== 'number' || !Number.isInteger(item) || item < 0 || item > 5) throw new InvalidChronicleNpcRequestError('body.deepProfile.' + key + ' must be an integer from 0 to 5'); return item }
function attributeRating(value: Record<string, unknown>, key: string): number { const item = value[key]; if (item === undefined) return 1; if (typeof item !== 'number' || !Number.isInteger(item) || item < 1 || item > 5) throw new InvalidChronicleNpcRequestError('body.deepProfile.attributes.' + key + ' must be an integer from 1 to 5'); return item }
function profileAttributes(value: Record<string, unknown>) { const raw = value.attributes === undefined ? {} : record(value.attributes); return { strength:attributeRating(raw,'strength'), dexterity:attributeRating(raw,'dexterity'), stamina:attributeRating(raw,'stamina'), charisma:attributeRating(raw,'charisma'), manipulation:attributeRating(raw,'manipulation'), composure:attributeRating(raw,'composure'), intelligence:attributeRating(raw,'intelligence'), wits:attributeRating(raw,'wits'), resolve:attributeRating(raw,'resolve') } }
function profileDisciplines(value: Record<string, unknown>) { const raw = value.disciplineDetails; if (raw === undefined) return profileList(value,'disciplines').map(name => ({ name, rating:1, powers:[] })); if (!Array.isArray(raw)) throw new InvalidChronicleNpcRequestError('body.deepProfile.disciplineDetails must be a list'); return raw.map((entry,index) => { const item=record(entry); const name=requiredText(item.name,`body.deepProfile.disciplineDetails.${index}.name`); const rating=profileRating(item,'rating'); if (rating < 1) throw new InvalidChronicleNpcRequestError(`body.deepProfile.disciplineDetails.${index}.rating must be from 1 to 5`); return { name, rating, powers:profileList(item,'powers') } }) }
function deepProfile(value: unknown): ChronicleNpcDeepProfile | null { if (value === null) return null; const item = record(value); const disciplineDetails=profileDisciplines(item); return { alias:profileText(item,'alias'), clan:profileText(item,'clan'), generation:profileText(item,'generation'), sire:profileText(item,'sire'), sect:profileText(item,'sect'), title:profileText(item,'title'), territory:profileText(item,'territory'), domain:profileText(item,'domain'), faction:profileText(item,'faction'), influence:profileRating(item,'influence'), resources:profileRating(item,'resources'), traits:profileList(item,'traits'), disciplines:disciplineDetails.map(entry=>entry.name), attributes:profileAttributes(item), disciplineDetails, allies:profileList(item,'allies'), rivals:profileList(item,'rivals'), history:profileText(item,'history') } }

const editableFields = [
  'name',
  'category',
  'description',
  'narrativeRole',
  'notes',
  'deepProfile',
] as const

function supportedKeys(
  value: Record<string, unknown>,
): void {
  const allowed =
    new Set<string>(editableFields)

  if (
    Object.keys(value).some(
      (key) => !allowed.has(key),
    )
  ) {
    throw new InvalidChronicleNpcRequestError(
      'body contains unsupported fields',
    )
  }
}

export function parseChronicleNpcIdParam(
  value: unknown,
): string {
  return uuid(value, 'npcId')
}

export function parseCreateChronicleNpcRequest(
  chronicleId: string,
  body: unknown,
): CreateChronicleNpcData {
  const value = record(body)

  supportedKeys(value)

  return {
    chronicleId,
    name: requiredText(
      value.name,
      'body.name',
    ),
    category:
      value.category === undefined
        ? null
        : optionalText(
            value.category,
            'body.category',
          ),
    description:
      value.description === undefined
        ? null
        : optionalText(
            value.description,
            'body.description',
          ),
    narrativeRole:
      value.narrativeRole === undefined
        ? null
        : optionalText(
            value.narrativeRole,
            'body.narrativeRole',
          ),
    notes:
      value.notes === undefined
        ? null
        : optionalText(
            value.notes,
            'body.notes',
          ),
    deepProfile: value.deepProfile === undefined ? undefined : deepProfile(value.deepProfile),
  }
}

export function parseUpdateChronicleNpcRequest(
  chronicleId: string,
  npcId: string,
  body: unknown,
): UpdateChronicleNpcData {
  const value = record(body)

  supportedKeys(value)

  if (Object.keys(value).length === 0) {
    throw new InvalidChronicleNpcRequestError(
      'body must contain at least one editable field',
    )
  }

  return {
    chronicleId,
    npcId,
    ...(value.name === undefined
      ? {}
      : {
          name: requiredText(
            value.name,
            'body.name',
          ),
        }),
    ...(value.category === undefined
      ? {}
      : {
          category: optionalText(
            value.category,
            'body.category',
          ),
        }),
    ...(value.description === undefined
      ? {}
      : {
          description: optionalText(
            value.description,
            'body.description',
          ),
        }),
    ...(value.narrativeRole === undefined
      ? {}
      : {
          narrativeRole: optionalText(
            value.narrativeRole,
            'body.narrativeRole',
          ),
        }),
    ...(value.notes === undefined
      ? {}
      : {
          notes: optionalText(
            value.notes,
            'body.notes',
          ),
        }),
    ...(value.deepProfile === undefined ? {} : { deepProfile: deepProfile(value.deepProfile) }),
  }
}

export function toChronicleNpcResponse(
  npc: ChronicleNpc,
): ChronicleNpcResponseDto {
  return {
    id: npc.id,
    chronicleId: npc.chronicleId,
    name: npc.name,
    category: npc.category,
    description: npc.description,
    narrativeRole:
      npc.narrativeRole,
    notes: npc.notes,
    status: npc.status,
    detailLevel: npc.detailLevel,
    deepProfile: npc.deepProfile,
    createdAt:
      npc.createdAt.toISOString(),
    updatedAt:
      npc.updatedAt.toISOString(),
  }
}
