import {
  Injectable,
} from '@nestjs/common'
import {
  ChronicleSessionStatus as PrismaChronicleSessionStatus,
} from '@prisma/client'
import type {
  ChronicleSession as PrismaChronicleSessionRecord,
} from '@prisma/client'
import {
  DatabaseService,
} from '../../database/database.service'
import type {
  ChronicleSessionRepository,
} from '../application/chronicle-session.repository'
import type {
  ChronicleSession,
  ChronicleSessionStatus,
  CreateChronicleSessionData,
  UpdateChronicleSessionData,
} from '../domain/chronicle-session.types'

const statusFromPrisma = {
  [PrismaChronicleSessionStatus.PREPARATION]:
    'preparation',
  [PrismaChronicleSessionStatus.COMPLETED]:
    'completed',
  [PrismaChronicleSessionStatus.ARCHIVED]:
    'archived',
} as const satisfies Record<
  PrismaChronicleSessionStatus,
  ChronicleSessionStatus
>

function toDomain(
  row: PrismaChronicleSessionRecord,
): ChronicleSession {
  return {
    id: row.id,
    chronicleId: row.chronicleId,
    sessionNumber: row.sessionNumber,
    title: row.title,
    realDate:
      row.realDate === null
        ? null
        : new Date(row.realDate),
    status: statusFromPrisma[row.status],
    summary: row.summary,
    narratorNotes: row.narratorNotes,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

@Injectable()
export class PrismaChronicleSessionRepository
  implements ChronicleSessionRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async listByChronicleId(
    chronicleId: string,
  ): Promise<readonly ChronicleSession[]> {
    const rows =
      await this.database.chronicleSession.findMany({
        where: {
          chronicleId,
        },
        orderBy: [
          { status: 'asc' },
          { sessionNumber: 'asc' },
          { realDate: 'asc' },
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
      })

    return rows.map(toDomain)
  }

  async findById(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSession | null> {
    const row =
      await this.database.chronicleSession.findFirst({
        where: {
          id: sessionId,
          chronicleId,
        },
      })

    return row === null
      ? null
      : toDomain(row)
  }

  async create(
    data: CreateChronicleSessionData,
  ): Promise<ChronicleSession> {
    const row =
      await this.database.chronicleSession.create({
        data: {
          chronicleId: data.chronicleId,
          sessionNumber: data.sessionNumber,
          title: data.title,
          realDate: data.realDate,
          summary: data.summary,
          narratorNotes: data.narratorNotes,
          status:
            PrismaChronicleSessionStatus.PREPARATION,
        },
      })

    return toDomain(row)
  }

  async update(
    data: UpdateChronicleSessionData,
  ): Promise<ChronicleSession | null> {
    const updated =
      await this.database.chronicleSession.updateMany({
        where: {
          id: data.sessionId,
          chronicleId: data.chronicleId,
          status: {
            not:
              PrismaChronicleSessionStatus.ARCHIVED,
          },
        },
        data: {
          ...(data.sessionNumber === undefined
            ? {}
            : {
                sessionNumber:
                  data.sessionNumber,
              }),
          ...(data.title === undefined
            ? {}
            : { title: data.title }),
          ...(data.realDate === undefined
            ? {}
            : { realDate: data.realDate }),
          ...(data.summary === undefined
            ? {}
            : { summary: data.summary }),
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
      data.sessionId,
    )
  }

  async complete(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSession | null> {
    const updated =
      await this.database.chronicleSession.updateMany({
        where: {
          id: sessionId,
          chronicleId,
          status:
            PrismaChronicleSessionStatus.PREPARATION,
        },
        data: {
          status:
            PrismaChronicleSessionStatus.COMPLETED,
        },
      })

    if (updated.count !== 1) {
      return null
    }

    return this.findById(
      chronicleId,
      sessionId,
    )
  }

  async archive(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSession | null> {
    const updated =
      await this.database.chronicleSession.updateMany({
        where: {
          id: sessionId,
          chronicleId,
          status: {
            not:
              PrismaChronicleSessionStatus.ARCHIVED,
          },
        },
        data: {
          status:
            PrismaChronicleSessionStatus.ARCHIVED,
        },
      })

    if (updated.count !== 1) {
      return null
    }

    return this.findById(
      chronicleId,
      sessionId,
    )
  }
}
