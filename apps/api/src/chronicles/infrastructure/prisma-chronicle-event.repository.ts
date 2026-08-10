import {
  Injectable,
} from '@nestjs/common'
import {
  ChronicleEventStatus as PrismaChronicleEventStatus,
} from '@prisma/client'
import type {
  ChronicleEvent as PrismaChronicleEventRecord,
} from '@prisma/client'
import {
  DatabaseService,
} from '../../database/database.service'
import {
  ChronicleEventReorderMismatchError,
} from '../application/chronicle-event.repository'
import type {
  ChronicleEventRepository,
} from '../application/chronicle-event.repository'
import type {
  ChronicleEvent,
  ChronicleEventStatus,
  CreateChronicleEventData,
  UpdateChronicleEventData,
} from '../domain/chronicle-event.types'

const statusFromPrisma = {
  [PrismaChronicleEventStatus.ACTIVE]:
    'active',
  [PrismaChronicleEventStatus.ARCHIVED]:
    'archived',
} as const satisfies Record<
  PrismaChronicleEventStatus,
  ChronicleEventStatus
>

function toDomain(
  row: PrismaChronicleEventRecord,
): ChronicleEvent {
  return {
    id: row.id,
    chronicleId: row.chronicleId,
    title: row.title,
    description: row.description,
    narratorNotes: row.narratorNotes,
    narrativeTimeLabel:
      row.narrativeTimeLabel,
    realDate:
      row.realDate === null
        ? null
        : new Date(row.realDate),
    timelineOrder: row.timelineOrder,
    status: statusFromPrisma[row.status],
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

@Injectable()
export class PrismaChronicleEventRepository
  implements ChronicleEventRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async listByChronicleId(
    chronicleId: string,
  ): Promise<readonly ChronicleEvent[]> {
    const rows =
      await this.database.chronicleEvent.findMany({
        where: {
          chronicleId,
        },
        orderBy: [
          { status: 'asc' },
          { timelineOrder: 'asc' },
          { createdAt: 'asc' },
          { id: 'asc' },
        ],
      })

    return rows.map(toDomain)
  }

  async findById(
    chronicleId: string,
    eventId: string,
  ): Promise<ChronicleEvent | null> {
    const row =
      await this.database.chronicleEvent.findFirst({
        where: {
          id: eventId,
          chronicleId,
        },
      })

    return row === null
      ? null
      : toDomain(row)
  }

  async create(
    data: CreateChronicleEventData,
  ): Promise<ChronicleEvent> {
    return this.database.$transaction(
      async (transaction) => {
        const order =
          await transaction.chronicleEvent.aggregate({
            where: {
              chronicleId: data.chronicleId,
              status:
                PrismaChronicleEventStatus.ACTIVE,
            },
            _max: {
              timelineOrder: true,
            },
          })

        const row =
          await transaction.chronicleEvent.create({
            data: {
              chronicleId: data.chronicleId,
              title: data.title,
              description: data.description,
              narratorNotes:
                data.narratorNotes,
              narrativeTimeLabel:
                data.narrativeTimeLabel,
              realDate: data.realDate,
              timelineOrder:
                (order._max.timelineOrder ?? -1) + 1,
              status:
                PrismaChronicleEventStatus.ACTIVE,
            },
          })

        return toDomain(row)
      },
    )
  }

  async update(
    data: UpdateChronicleEventData,
  ): Promise<ChronicleEvent | null> {
    const updated =
      await this.database.chronicleEvent.updateMany({
        where: {
          id: data.eventId,
          chronicleId: data.chronicleId,
          status:
            PrismaChronicleEventStatus.ACTIVE,
        },
        data: {
          ...(data.title === undefined
            ? {}
            : { title: data.title }),
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
          ...(data.narrativeTimeLabel === undefined
            ? {}
            : {
                narrativeTimeLabel:
                  data.narrativeTimeLabel,
              }),
          ...(data.realDate === undefined
            ? {}
            : {
                realDate:
                  data.realDate,
              }),
        },
      })

    if (updated.count !== 1) {
      return null
    }

    return this.findById(
      data.chronicleId,
      data.eventId,
    )
  }

  async reorderActive(
    chronicleId: string,
    eventIds: readonly string[],
  ): Promise<readonly ChronicleEvent[]> {
    return this.database.$transaction(
      async (transaction) => {
        const active =
          await transaction.chronicleEvent.findMany({
            where: {
              chronicleId,
              status:
                PrismaChronicleEventStatus.ACTIVE,
            },
            select: {
              id: true,
            },
          })

        const requested =
          new Set(eventIds)
        const current =
          new Set(
            active.map(
              (event) => event.id,
            ),
          )

        if (
          requested.size !== eventIds.length ||
          current.size !== requested.size ||
          eventIds.some(
            (eventId) =>
              !current.has(eventId),
          )
        ) {
          throw new ChronicleEventReorderMismatchError()
        }

        await Promise.all(
          eventIds.map(
            (
              eventId,
              timelineOrder,
            ) =>
              transaction.chronicleEvent.updateMany({
                where: {
                  id: eventId,
                  chronicleId,
                  status:
                    PrismaChronicleEventStatus.ACTIVE,
                },
                data: {
                  timelineOrder,
                },
              }),
          ),
        )

        const rows =
          await transaction.chronicleEvent.findMany({
            where: {
              chronicleId,
              status:
                PrismaChronicleEventStatus.ACTIVE,
            },
            orderBy: [
              { timelineOrder: 'asc' },
              { createdAt: 'asc' },
              { id: 'asc' },
            ],
          })

        return rows.map(toDomain)
      },
    )
  }

  async archive(
    chronicleId: string,
    eventId: string,
  ): Promise<ChronicleEvent | null> {
    const updated =
      await this.database.chronicleEvent.updateMany({
        where: {
          id: eventId,
          chronicleId,
          status:
            PrismaChronicleEventStatus.ACTIVE,
        },
        data: {
          status:
            PrismaChronicleEventStatus.ARCHIVED,
        },
      })

    if (updated.count !== 1) {
      return null
    }

    return this.findById(
      chronicleId,
      eventId,
    )
  }
}
