import {
  Injectable,
} from '@nestjs/common'

import {
  DiceRollSource as PrismaDiceRollSource,
  DiceRollVisibility as PrismaDiceRollVisibility,
  Prisma,
} from '@prisma/client'

import {
  DatabaseService,
} from '../../database/database.service'

import type {
  DiceRollRepository,
} from '../application/dice-roll.repository'

import type {
  BuiltDicePool,
} from '../domain/dice-pool.types'

import type {
  DiceRollResolution,
} from '../domain/dice-roll.types'

import type {
  DiceHistorySource,
  DiceHistoryVisibility,
  DiceRollHistoryPage,
  DiceRollHistoryQuery,
  DiceRollRecord,
  NewDiceRollRecord,
} from '../domain/dice-history.types'

const withActor = {
  actor: {
    select: {
      displayName: true,
    },
  },
} as const

type Row = Prisma.DiceRollRecordGetPayload<{
  include: typeof withActor
}>

const sourceToPrisma = {
  manual: PrismaDiceRollSource.MANUAL,
  character: PrismaDiceRollSource.CHARACTER,
  action: PrismaDiceRollSource.ACTION,
} as const satisfies Record<
  DiceHistorySource,
  PrismaDiceRollSource
>

const sourceFromPrisma = {
  [PrismaDiceRollSource.MANUAL]: 'manual',
  [PrismaDiceRollSource.CHARACTER]: 'character',
  [PrismaDiceRollSource.ACTION]: 'action',
} as const satisfies Record<
  PrismaDiceRollSource,
  DiceHistorySource
>

const visibilityToPrisma = {
  contextual: PrismaDiceRollVisibility.CONTEXTUAL,
  private: PrismaDiceRollVisibility.PRIVATE,
} as const satisfies Record<
  DiceHistoryVisibility,
  PrismaDiceRollVisibility
>

const visibilityFromPrisma = {
  [PrismaDiceRollVisibility.CONTEXTUAL]: 'contextual',
  [PrismaDiceRollVisibility.PRIVATE]: 'private',
} as const satisfies Record<
  PrismaDiceRollVisibility,
  DiceHistoryVisibility
>

function json(
  value: unknown,
): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value),
  ) as Prisma.InputJsonValue
}

function toDomain(row: Row): DiceRollRecord {
  return {
    id: row.id,
    actorId: row.actorId,
    actorDisplayName: row.actor.displayName,
    characterId: row.characterId,
    chronicleId: row.chronicleId,
    sessionId: row.sessionId,
    rerollParentId: row.rerollParentId,
    source: sourceFromPrisma[row.source],
    visibility:
      visibilityFromPrisma[row.visibility],
    description: row.description,
    rulesVersion: row.rulesVersion,
    pool:
      row.poolSnapshot as unknown as BuiltDicePool,
    roll:
      row.rollSnapshot as unknown as DiceRollResolution,
    createdAt: new Date(row.createdAt),
  }
}

@Injectable()
export class PrismaDiceRollRepository
  implements DiceRollRepository {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async create(
    data: NewDiceRollRecord,
  ): Promise<DiceRollRecord> {
    const row = await this.database.diceRollRecord.create({
      data: {
        actorId: data.actorId,
        characterId: data.characterId,
        chronicleId: data.chronicleId,
        sessionId: data.sessionId,
        rerollParentId: data.rerollParentId,
        source: sourceToPrisma[data.source],
        visibility:
          visibilityToPrisma[data.visibility],
        description: data.description,
        rulesVersion: data.rulesVersion,
        poolSnapshot: json(data.pool),
        rollSnapshot: json(data.roll),
      },
      include: withActor,
    })

    return toDomain(row)
  }

  async findById(
    id: string,
  ): Promise<DiceRollRecord | null> {
    const row = await this.database.diceRollRecord.findUnique({
      where: { id },
      include: withActor,
    })

    return row === null ? null : toDomain(row)
  }

  async findCharacterContext(
    characterId: string,
  ): Promise<{
    readonly ownerId: string
    readonly chronicleId: string | null
  } | null> {
    return this.database.character.findUnique({
      where: { id: characterId },
      select: {
        ownerId: true,
        chronicleId: true,
      },
    })
  }

  async list(
    query: DiceRollHistoryQuery,
  ): Promise<DiceRollHistoryPage> {
    const access: Prisma.DiceRollRecordWhereInput =
      query.accessScope === 'actor'
        ? { actorId: query.viewerId }
        : query.accessScope === 'participant'
          ? {
              OR: [
                {
                  visibility:
                    PrismaDiceRollVisibility.CONTEXTUAL,
                },
                { actorId: query.viewerId },
              ],
            }
          : {}

    const cursor: Prisma.DiceRollRecordWhereInput =
      query.cursor === null
        ? {}
        : {
            OR: [
              {
                createdAt: {
                  lt: query.cursor.createdAt,
                },
              },
              {
                createdAt: query.cursor.createdAt,
                id: { lt: query.cursor.id },
              },
            ],
          }

    const filters: Prisma.DiceRollRecordWhereInput = {
      ...(query.actorId === undefined
        ? {}
        : { actorId: query.actorId }),
      ...(query.characterId === undefined
        ? {}
        : { characterId: query.characterId }),
      ...(query.chronicleId === undefined
        ? {}
        : { chronicleId: query.chronicleId }),
      ...(query.sessionId === undefined
        ? {}
        : { sessionId: query.sessionId }),
      ...(query.source === undefined
        ? {}
        : { source: sourceToPrisma[query.source] }),
      ...(query.description === undefined
        ? {}
        : {
            description: {
              contains: query.description,
              mode: 'insensitive',
            },
          }),
    }

    const rows = await this.database.diceRollRecord.findMany({
      where: {
        AND: [filters, access, cursor],
      },
      include: withActor,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      take: query.limit + 1,
    })

    const hasMore = rows.length > query.limit
    const pageRows = hasMore
      ? rows.slice(0, query.limit)
      : rows
    const last = pageRows.at(-1)

    return {
      items: pageRows.map(toDomain),
      nextCursor:
        hasMore && last !== undefined
          ? {
              createdAt: new Date(last.createdAt),
              id: last.id,
            }
          : null,
    }
  }
}
