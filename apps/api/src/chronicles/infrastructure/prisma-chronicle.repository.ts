import {
  Injectable,
} from '@nestjs/common'

import {
  ChronicleStatus as PrismaChronicleStatus,
} from '@prisma/client'

import type {
  Chronicle as PrismaChronicleRecord,
} from '@prisma/client'

import {
  DatabaseService,
} from '../../database/database.service'

import type {
  ChronicleRepository,
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
          narratorId,
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
}
