import {
  MAX_OFFSET_PAGE_LIMIT,
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
  ChronicleParticipantRole as PrismaChronicleParticipantRole,
  ChronicleParticipantStatus as PrismaChronicleParticipantStatus,
} from '@prisma/client'

import type {
  ChronicleParticipant as PrismaChronicleParticipantRecord,
  User as PrismaUserRecord,
} from '@prisma/client'

import {
  Prisma,
} from '@prisma/client'

import {
  DatabaseService,
} from '../../database/database.service'

import {
  ChronicleParticipantDuplicateError,
  ChronicleParticipantWriteConflictError,
} from '../application/chronicle-participant.repository'

import type {
  ChronicleParticipantRepository,
} from '../application/chronicle-participant.repository'

import type {
  AddChronicleParticipantData,
  ChronicleParticipant,
  ChronicleParticipantRole,
  ChronicleParticipantStatus,
} from '../domain/chronicle-participant.types'

type ParticipantWithUser =
  PrismaChronicleParticipantRecord & {
    readonly user: Pick<
      PrismaUserRecord,
      'username' | 'displayName'
    >
  }

const roleFromPrisma = {
  [PrismaChronicleParticipantRole.NARRATOR]:
    'narrator',
  [PrismaChronicleParticipantRole.PLAYER]:
    'player',
} as const satisfies Record<
  PrismaChronicleParticipantRole,
  ChronicleParticipantRole
>

const roleToPrisma = {
  narrator:
    PrismaChronicleParticipantRole.NARRATOR,
  player:
    PrismaChronicleParticipantRole.PLAYER,
} as const satisfies Record<
  ChronicleParticipantRole,
  PrismaChronicleParticipantRole
>

const statusFromPrisma = {
  [PrismaChronicleParticipantStatus.ACTIVE]:
    'active',
  [PrismaChronicleParticipantStatus.RETIRED]:
    'retired',
} as const satisfies Record<
  PrismaChronicleParticipantStatus,
  ChronicleParticipantStatus
>

function toDomain(
  row: ParticipantWithUser,
): ChronicleParticipant {
  return {
    id: row.id,
    chronicleId: row.chronicleId,
    userId: row.userId,
    username: row.user.username,
    displayName: row.user.displayName,
    role: roleFromPrisma[row.role],
    status: statusFromPrisma[row.status],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

const withUser = {
  user: {
    select: {
      username: true,
      displayName: true,
    },
  },
} as const

@Injectable()
export class PrismaChronicleParticipantRepository
  implements ChronicleParticipantRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async findActiveMembership(
    chronicleId: string,
    userId: string,
  ): Promise<ChronicleParticipant | null> {
    const row =
      await this.database.chronicleParticipant.findFirst({
        where: {
          chronicleId,
          userId,
          status:
            PrismaChronicleParticipantStatus.ACTIVE,
        },
        include: withUser,
      })

    return row === null
      ? null
      : toDomain(row)
  }

  async findById(
    chronicleId: string,
    participantId: string,
  ): Promise<ChronicleParticipant | null> {
    const row =
      await this.database.chronicleParticipant.findFirst({
        where: {
          id: participantId,
          chronicleId,
        },
        include: withUser,
      })

    return row === null
      ? null
      : toDomain(row)
  }

  async findByUserId(
    chronicleId: string,
    userId: string,
  ): Promise<ChronicleParticipant | null> {
    const row =
      await this.database.chronicleParticipant.findUnique({
        where: {
          chronicleId_userId: {
            chronicleId,
            userId,
          },
        },
        include: withUser,
      })

    return row === null
      ? null
      : toDomain(row)
  }

  listByChronicleId(
    chronicleId: string,
  ): Promise<
    readonly ChronicleParticipant[]
  >

  listByChronicleId(
    chronicleId: string,
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<ChronicleParticipant>
  >

  async listByChronicleId(
    chronicleId: string,
    query?: OffsetPaginationQuery,
  ): Promise<
    | readonly ChronicleParticipant[]
    | OffsetPage<ChronicleParticipant>
  > {
    if (query !== undefined) {
      return this.listByChronicleIdPage(
        chronicleId,
        query,
      )
    }

    const items:
      ChronicleParticipant[] = []

    let nextOffset: number | null = 0

    while (nextOffset !== null) {
      const page =
        await this.listByChronicleIdPage(
          chronicleId,
          {
            limit:
              MAX_OFFSET_PAGE_LIMIT,
            offset: nextOffset,
          },
        )

      items.push(...page.items)
      nextOffset = page.nextOffset
    }

    return items
  }

  private async listByChronicleIdPage(
    chronicleId: string,
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<ChronicleParticipant>
  > {
    const rows =
      await this.database.chronicleParticipant.findMany({
        where: {
          chronicleId,
        },
        include: withUser,
        orderBy: [
          {
            role: 'asc',
          },
          {
            status: 'asc',
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

  async userExists(
    userId: string,
  ): Promise<boolean> {
    return (
      await this.database.user.count({
        where: {
          id: userId,
        },
      })
    ) === 1
  }

  async add(
    data: AddChronicleParticipantData,
  ): Promise<ChronicleParticipant> {
    try {
      const row =
        await this.database.chronicleParticipant.create({
          data: {
            chronicleId: data.chronicleId,
            userId: data.userId,
            role:
              roleToPrisma[data.role],
            status:
              PrismaChronicleParticipantStatus.ACTIVE,
          },
          include: withUser,
        })

      return toDomain(row)
    } catch (error: unknown) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ChronicleParticipantDuplicateError(
          data.chronicleId,
          data.userId,
        )
      }

      throw error
    }
  }

  async countActiveNarrators(
    chronicleId: string,
  ): Promise<number> {
    return this.database.chronicleParticipant.count({
      where: {
        chronicleId,
        role:
          PrismaChronicleParticipantRole.NARRATOR,
        status:
          PrismaChronicleParticipantStatus.ACTIVE,
      },
    })
  }

  async retire(
    chronicleId: string,
    participantId: string,
  ): Promise<ChronicleParticipant> {
    const updated =
      await this.database.chronicleParticipant.updateMany({
        where: {
          id: participantId,
          chronicleId,
          status:
            PrismaChronicleParticipantStatus.ACTIVE,
        },
        data: {
          status:
            PrismaChronicleParticipantStatus.RETIRED,
        },
      })

    if (updated.count !== 1) {
      throw new ChronicleParticipantWriteConflictError(
        participantId,
      )
    }

    const row =
      await this.database.chronicleParticipant.findFirst({
        where: {
          id: participantId,
          chronicleId,
        },
        include: withUser,
      })

    if (row === null) {
      throw new ChronicleParticipantWriteConflictError(
        participantId,
      )
    }

    return toDomain(row)
  }
}
