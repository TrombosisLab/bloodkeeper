import type {
  ChronicleSessionContext,
  ReplaceChronicleSessionContextData,
} from '../domain/chronicle-session-context.types'

export class InvalidChronicleSessionContextRequestError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      'InvalidChronicleSessionContextRequestError'
  }
}

export interface ChronicleSessionContextResponseDto {
  readonly sessionId: string
  readonly events: readonly {
    readonly id: string
    readonly title: string
    readonly status:
      | 'active'
      | 'archived'
    readonly narrativeTimeLabel:
      string | null
    readonly realDate:
      string | null
    readonly timelineOrder: number
  }[]
  readonly npcs: readonly {
    readonly id: string
    readonly name: string
    readonly status:
      | 'active'
      | 'archived'
    readonly category: string | null
    readonly narrativeRole:
      string | null
  }[]
  readonly locations: readonly {
    readonly id: string
    readonly name: string
    readonly status:
      | 'active'
      | 'archived'
    readonly category: string | null
    readonly parentLocationId:
      string | null
  }[]
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function record(
  value: unknown,
): Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidChronicleSessionContextRequestError(
      'body must be an object',
    )
  }

  return value as Record<string, unknown>
}

function uuidArray(
  value: unknown,
  field: string,
): readonly string[] {
  if (!Array.isArray(value)) {
    throw new InvalidChronicleSessionContextRequestError(
      `${field} must be an array`,
    )
  }

  const ids =
    value.map(
      (item) => {
        if (
          typeof item !== 'string' ||
          !uuidPattern.test(item)
        ) {
          throw new InvalidChronicleSessionContextRequestError(
            `${field} must contain only UUIDs`,
          )
        }

        return item
      },
    )

  if (
    new Set(ids).size !== ids.length
  ) {
    throw new InvalidChronicleSessionContextRequestError(
      `${field} must not contain duplicates`,
    )
  }

  return ids
}

export function parseReplaceChronicleSessionContextRequest(
  chronicleId: string,
  sessionId: string,
  body: unknown,
): ReplaceChronicleSessionContextData {
  const value = record(body)

  const allowed =
    new Set([
      'eventIds',
      'npcIds',
      'locationIds',
    ])

  if (
    Object.keys(value).some(
      (key) => !allowed.has(key),
    )
  ) {
    throw new InvalidChronicleSessionContextRequestError(
      'body contains unsupported fields',
    )
  }

  for (const field of allowed) {
    if (!(field in value)) {
      throw new InvalidChronicleSessionContextRequestError(
        `body.${field} is required`,
      )
    }
  }

  return {
    chronicleId,
    sessionId,
    eventIds:
      uuidArray(
        value.eventIds,
        'body.eventIds',
      ),
    npcIds:
      uuidArray(
        value.npcIds,
        'body.npcIds',
      ),
    locationIds:
      uuidArray(
        value.locationIds,
        'body.locationIds',
      ),
  }
}

export function toChronicleSessionContextResponse(
  context: ChronicleSessionContext,
): ChronicleSessionContextResponseDto {
  return {
    sessionId:
      context.sessionId,
    events:
      context.events.map(
        (event) => ({
          id: event.id,
          title:
            event.title,
          status:
            event.status,
          narrativeTimeLabel:
            event.narrativeTimeLabel,
          realDate:
            event.realDate === null
              ? null
              : event.realDate.toISOString(),
          timelineOrder:
            event.timelineOrder,
        }),
      ),
    npcs:
      context.npcs.map(
        (npc) => ({
          id: npc.id,
          name: npc.name,
          status: npc.status,
          category:
            npc.category,
          narrativeRole:
            npc.narrativeRole,
        }),
      ),
    locations:
      context.locations.map(
        (location) => ({
          id: location.id,
          name:
            location.name,
          status:
            location.status,
          category:
            location.category,
          parentLocationId:
            location.parentLocationId,
        }),
      ),
  }
}
