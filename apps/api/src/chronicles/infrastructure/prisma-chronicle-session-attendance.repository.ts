import {
  Injectable,
} from '@nestjs/common'

import {
  CharacterStatus as PrismaCharacterStatus,
} from '@prisma/client'

import type {
  ChronicleSessionAttendance as PrismaChronicleSessionAttendanceRecord,
} from '@prisma/client'

import {
  offsetPageFromRows,
} from '../../common/offset-pagination'
import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import {
  DatabaseService,
} from '../../database/database.service'

import type {
  ChronicleSessionAttendanceRepository,
} from '../application/chronicle-session-attendance.repository'

import type {
  ChronicleSessionAttendance,
} from '../domain/chronicle-session-attendance.types'

function toDomain(
  row:
    PrismaChronicleSessionAttendanceRecord,
): ChronicleSessionAttendance {
  return {
    id: row.id,
    sessionId: row.sessionId,
    characterId: row.characterId,
    createdAt:
      new Date(row.createdAt),
    updatedAt:
      new Date(row.updatedAt),
  }
}

@Injectable()
export class PrismaChronicleSessionAttendanceRepository
  implements ChronicleSessionAttendanceRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async listBySessionId(
    sessionId: string,
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<ChronicleSessionAttendance>
  > {
    const rows =
      await this.database
        .chronicleSessionAttendance
        .findMany({
          where: {
            sessionId,
            removedAt: null,
          },
          orderBy: [
            { createdAt: 'asc' },
            { id: 'asc' },
          ],
          skip: query.offset,
          take: query.limit + 1,
        })

    return offsetPageFromRows(
      rows.map(toDomain),
      query,
    )
  }

  async isEligibleCharacter(
    chronicleId: string,
    characterId: string,
  ): Promise<boolean> {
    const character =
      await this.database.character.findFirst({
        where: {
          id: characterId,
          chronicleId,
          status:
            PrismaCharacterStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      })

    return character !== null
  }

  async add(
    sessionId: string,
    characterId: string,
  ): Promise<ChronicleSessionAttendance> {
    const row =
      await this.database
        .chronicleSessionAttendance
        .upsert({
          where: {
            sessionId_characterId: {
              sessionId,
              characterId,
            },
          },
          create: {
            sessionId,
            characterId,
          },
          update: {
            removedAt: null,
          },
        })

    return toDomain(row)
  }

  async remove(
    sessionId: string,
    characterId: string,
  ): Promise<void> {
    await this.database
      .chronicleSessionAttendance
      .updateMany({
        where: {
          sessionId,
          characterId,
          removedAt: null,
        },
        data: {
          removedAt: new Date(),
        },
      })
  }
}
