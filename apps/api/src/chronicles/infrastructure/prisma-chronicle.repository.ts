import {
  Injectable,
} from '@nestjs/common'

import {
  ChronicleParticipantRole as PrismaChronicleParticipantRole,
  ChronicleParticipantStatus as PrismaChronicleParticipantStatus,
  ChronicleStatus as PrismaChronicleStatus,
} from '@prisma/client'

import type {
  Chronicle as PrismaChronicleRecord,
} from '@prisma/client'

import {
  DatabaseService,
} from '../../database/database.service'

import {
  ChronicleLifecycleWriteConflictError,
} from '../application/chronicle.repository'

import type {
  ChronicleRepository,
  TransitionChronicleLifecycleData,
} from '../application/chronicle.repository'

import type {
  Chronicle,
  ChronicleStatus,
  CreateChronicleData,
} from '../domain/chronicle.types'

const statusFromPrisma = {
  [PrismaChronicleStatus.PREPARATION]:
    'preparation',
  [PrismaChronicleStatus.ACTIVE]:
    'active',
  [PrismaChronicleStatus.ARCHIVED]:
    'archived',
} as const satisfies Record<
  PrismaChronicleStatus,
  ChronicleStatus
>

const statusToPrisma = {
  preparation:
    PrismaChronicleStatus.PREPARATION,
  active:
    PrismaChronicleStatus.ACTIVE,
  archived:
    PrismaChronicleStatus.ARCHIVED,
} as const satisfies Record<
  ChronicleStatus,
  PrismaChronicleStatus
>

function toDomain(
  row: PrismaChronicleRecord,
): Chronicle {
  return {
    id: row.id,
    narratorId: row.narratorId,
    name: row.name,
    description: row.description,
    status: statusFromPrisma[row.status],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

@Injectable()
export class PrismaChronicleRepository
  implements ChronicleRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async create(
    data: CreateChronicleData,
  ): Promise<Chronicle> {
    const row =
      await this.database.chronicle.create({
        data: {
          narratorId: data.narratorId,
          name: data.name,
          description: data.description,
          participants: {
            create: {
              userId: data.narratorId,
              role:
                PrismaChronicleParticipantRole.NARRATOR,
              status:
                PrismaChronicleParticipantStatus.ACTIVE,
            },
          },
        },
      })

    return toDomain(row)
  }

  async findByNarratorId(
    narratorId: string,
  ): Promise<readonly Chronicle[]> {
    const rows =
      await this.database.chronicle.findMany({
        where: {
          participants: {
            some: {
              userId: narratorId,
              status:
                PrismaChronicleParticipantStatus.ACTIVE,
            },
          },
        },
        orderBy: [
          {
            updatedAt: 'desc',
          },
          {
            id: 'asc',
          },
        ],
      })

    return rows.map(toDomain)
  }

  async findById(
    narratorId: string,
    chronicleId: string,
  ): Promise<Chronicle | null> {
    const row =
      await this.database.chronicle.findFirst({
        where: {
          id: chronicleId,
          participants: {
            some: {
              userId: narratorId,
              status:
                PrismaChronicleParticipantStatus.ACTIVE,
            },
          },
        },
      })

    return row === null
      ? null
      : toDomain(row)
  }

  async transitionLifecycle(
    narratorId: string,
    data: TransitionChronicleLifecycleData,
  ): Promise<Chronicle> {
    const updated =
      await this.database.chronicle.updateMany({
        where: {
          id: data.chronicleId,
          status:
            statusToPrisma[
              data.expectedStatus
            ],
          participants: {
            some: {
              userId: narratorId,
              role:
                PrismaChronicleParticipantRole.NARRATOR,
              status:
                PrismaChronicleParticipantStatus.ACTIVE,
            },
          },
        },
        data: {
          status:
            statusToPrisma[data.nextStatus],
        },
      })

    if (updated.count !== 1) {
      throw new ChronicleLifecycleWriteConflictError(
        data.chronicleId,
      )
    }

    const row =
      await this.database.chronicle.findFirst({
        where: {
          id: data.chronicleId,
          participants: {
            some: {
              userId: narratorId,
              role:
                PrismaChronicleParticipantRole.NARRATOR,
              status:
                PrismaChronicleParticipantStatus.ACTIVE,
            },
          },
        },
      })

    if (row === null) {
      throw new ChronicleLifecycleWriteConflictError(
        data.chronicleId,
      )
    }

    return toDomain(row)
  }
}
