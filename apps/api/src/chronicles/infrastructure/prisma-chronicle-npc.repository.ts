import {
  offsetPageFromRows,
} from '../../common/offset-pagination'

import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import {
  Injectable,
} from '@nestjs/common'

import {
  ChronicleNpcDetailLevel as PrismaChronicleNpcDetailLevel,
  ChronicleNpcStatus as PrismaChronicleNpcStatus,
} from '@prisma/client'

import type {
  ChronicleNpc as PrismaChronicleNpcRecord,
} from '@prisma/client'

import {
  DatabaseService,
} from '../../database/database.service'

import type {
  ChronicleNpcRepository,
} from '../application/chronicle-npc.repository'

import type {
  ChronicleNpc,
  ChronicleNpcDetailLevel,
  ChronicleNpcStatus,
  CreateChronicleNpcData,
  UpdateChronicleNpcData,
} from '../domain/chronicle-npc.types'

const statusFromPrisma = {
  [PrismaChronicleNpcStatus.ACTIVE]:
    'active',
  [PrismaChronicleNpcStatus.ARCHIVED]:
    'archived',
} as const satisfies Record<
  PrismaChronicleNpcStatus,
  ChronicleNpcStatus
>

const detailLevelFromPrisma = {
  [PrismaChronicleNpcDetailLevel.SIMPLE]:
    'simple',
} as const satisfies Record<
  PrismaChronicleNpcDetailLevel,
  ChronicleNpcDetailLevel
>

function toDomain(
  row: PrismaChronicleNpcRecord,
): ChronicleNpc {
  return {
    id: row.id,
    chronicleId: row.chronicleId,
    name: row.name,
    category: row.category,
    description: row.description,
    narrativeRole: row.narrativeRole,
    notes: row.notes,
    status: statusFromPrisma[row.status],
    detailLevel:
      detailLevelFromPrisma[
        row.detailLevel
      ],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

@Injectable()
export class PrismaChronicleNpcRepository
  implements ChronicleNpcRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async listByChronicleId(
    chronicleId: string,
    query: OffsetPaginationQuery,
  ): Promise<OffsetPage<ChronicleNpc>> {
    const rows =
      await this.database.chronicleNpc.findMany({
        where: {
          chronicleId,
        },
        orderBy: [
          {
            status: 'asc',
          },
          {
            name: 'asc',
          },
          {
            createdAt: 'asc',
          },
          {
            id: 'asc',
          },
        ],
        skip: query.offset,
        take: query.limit + 1,
      })

    return offsetPageFromRows(
      rows.map(toDomain),
      query,
    )
  }

  async findById(
    chronicleId: string,
    npcId: string,
  ): Promise<ChronicleNpc | null> {
    const row =
      await this.database.chronicleNpc.findFirst({
        where: {
          id: npcId,
          chronicleId,
        },
      })

    return row === null
      ? null
      : toDomain(row)
  }

  async create(
    data: CreateChronicleNpcData,
  ): Promise<ChronicleNpc> {
    const row =
      await this.database.chronicleNpc.create({
        data: {
          chronicleId: data.chronicleId,
          name: data.name,
          category: data.category,
          description: data.description,
          narrativeRole:
            data.narrativeRole,
          notes: data.notes,
          status:
            PrismaChronicleNpcStatus.ACTIVE,
          detailLevel:
            PrismaChronicleNpcDetailLevel.SIMPLE,
        },
      })

    return toDomain(row)
  }

  async update(
    data: UpdateChronicleNpcData,
  ): Promise<ChronicleNpc | null> {
    const updated =
      await this.database.chronicleNpc.updateMany({
        where: {
          id: data.npcId,
          chronicleId: data.chronicleId,
          status:
            PrismaChronicleNpcStatus.ACTIVE,
        },
        data: {
          ...(data.name === undefined
            ? {}
            : { name: data.name }),
          ...(data.category === undefined
            ? {}
            : {
                category:
                  data.category,
              }),
          ...(data.description === undefined
            ? {}
            : {
                description:
                  data.description,
              }),
          ...(data.narrativeRole === undefined
            ? {}
            : {
                narrativeRole:
                  data.narrativeRole,
              }),
          ...(data.notes === undefined
            ? {}
            : {
                notes: data.notes,
              }),
        },
      })

    if (updated.count !== 1) {
      return null
    }

    return this.findById(
      data.chronicleId,
      data.npcId,
    )
  }

  async archive(
    chronicleId: string,
    npcId: string,
  ): Promise<ChronicleNpc | null> {
    const updated =
      await this.database.chronicleNpc.updateMany({
        where: {
          id: npcId,
          chronicleId,
          status:
            PrismaChronicleNpcStatus.ACTIVE,
        },
        data: {
          status:
            PrismaChronicleNpcStatus.ARCHIVED,
        },
      })

    if (updated.count !== 1) {
      return null
    }

    return this.findById(
      chronicleId,
      npcId,
    )
  }
}
