import {
  Injectable,
} from '@nestjs/common'

import {
  ChronicleLocationStatus as PrismaChronicleLocationStatus,
} from '@prisma/client'

import type {
  ChronicleLocation as PrismaChronicleLocationRecord,
} from '@prisma/client'

import {
  DatabaseService,
} from '../../database/database.service'

import type {
  ChronicleLocationRepository,
} from '../application/chronicle-location.repository'

import type {
  ChronicleLocation,
  ChronicleLocationStatus,
  CreateChronicleLocationData,
  UpdateChronicleLocationData,
} from '../domain/chronicle-location.types'

const statusFromPrisma = {
  [PrismaChronicleLocationStatus.ACTIVE]:
    'active',
  [PrismaChronicleLocationStatus.ARCHIVED]:
    'archived',
} as const satisfies Record<
  PrismaChronicleLocationStatus,
  ChronicleLocationStatus
>

function toDomain(
  row: PrismaChronicleLocationRecord,
): ChronicleLocation {
  return {
    id: row.id,
    chronicleId: row.chronicleId,
    parentLocationId:
      row.parentLocationId,
    name: row.name,
    category: row.category,
    description: row.description,
    narratorNotes: row.narratorNotes,
    status: statusFromPrisma[row.status],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

@Injectable()
export class PrismaChronicleLocationRepository
  implements ChronicleLocationRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async listByChronicleId(
    chronicleId: string,
  ): Promise<readonly ChronicleLocation[]> {
    const rows =
      await this.database.chronicleLocation.findMany({
        where: {
          chronicleId,
        },
        orderBy: [
          { status: 'asc' },
          { name: 'asc' },
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
      })

    return rows.map(toDomain)
  }

  async findById(
    chronicleId: string,
    locationId: string,
  ): Promise<ChronicleLocation | null> {
    const row =
      await this.database.chronicleLocation.findFirst({
        where: {
          id: locationId,
          chronicleId,
        },
      })

    return row === null
      ? null
      : toDomain(row)
  }

  async create(
    data: CreateChronicleLocationData,
  ): Promise<ChronicleLocation> {
    const row =
      await this.database.chronicleLocation.create({
        data: {
          chronicleId: data.chronicleId,
          parentLocationId:
            data.parentLocationId,
          name: data.name,
          category: data.category,
          description: data.description,
          narratorNotes:
            data.narratorNotes,
          status:
            PrismaChronicleLocationStatus.ACTIVE,
        },
      })

    return toDomain(row)
  }

  async update(
    data: UpdateChronicleLocationData,
  ): Promise<ChronicleLocation | null> {
    const updated =
      await this.database.chronicleLocation.updateMany({
        where: {
          id: data.locationId,
          chronicleId: data.chronicleId,
          status:
            PrismaChronicleLocationStatus.ACTIVE,
        },
        data: {
          ...(data.parentLocationId === undefined
            ? {}
            : {
                parentLocationId:
                  data.parentLocationId,
              }),
          ...(data.name === undefined
            ? {}
            : { name: data.name }),
          ...(data.category === undefined
            ? {}
            : { category: data.category }),
          ...(data.description === undefined
            ? {}
            : {
                description:
                  data.description,
              }),
          ...(data.narratorNotes === undefined
            ? {}
            : {
                narratorNotes:
                  data.narratorNotes,
              }),
        },
      })

    if (updated.count !== 1) {
      return null
    }

    return this.findById(
      data.chronicleId,
      data.locationId,
    )
  }

  async archive(
    chronicleId: string,
    locationId: string,
  ): Promise<ChronicleLocation | null> {
    const updated =
      await this.database.chronicleLocation.updateMany({
        where: {
          id: locationId,
          chronicleId,
          status:
            PrismaChronicleLocationStatus.ACTIVE,
        },
        data: {
          status:
            PrismaChronicleLocationStatus.ARCHIVED,
        },
      })

    if (updated.count !== 1) {
      return null
    }

    return this.findById(
      chronicleId,
      locationId,
    )
  }
}
