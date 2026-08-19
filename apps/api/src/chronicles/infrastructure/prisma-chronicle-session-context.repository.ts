import {
  Injectable,
} from '@nestjs/common'

import {
  ChronicleEventStatus as PrismaChronicleEventStatus,
  ChronicleLocationStatus as PrismaChronicleLocationStatus,
  ChronicleNpcStatus as PrismaChronicleNpcStatus,
  ChronicleSessionStatus as PrismaChronicleSessionStatus,
} from '@prisma/client'

import {
  DatabaseService,
} from '../../database/database.service'

import {
  ChronicleSessionContextNotEditableError,
  ChronicleSessionContextReferenceError,
} from '../application/chronicle-session-context.repository'

import type {
  ChronicleSessionContextRepository,
  ChronicleSessionContextResourceKind,
} from '../application/chronicle-session-context.repository'

import type {
  ChronicleSessionContext,
  ChronicleSessionContextEvent,
  ChronicleSessionContextLocation,
  ChronicleSessionContextNpc,
  ReplaceChronicleSessionContextData,
} from '../domain/chronicle-session-context.types'

function eventStatus(
  value: PrismaChronicleEventStatus,
): 'active' | 'archived' {
  return value ===
    PrismaChronicleEventStatus.ACTIVE
    ? 'active'
    : 'archived'
}

function npcStatus(
  value: PrismaChronicleNpcStatus,
): 'active' | 'archived' {
  return value ===
    PrismaChronicleNpcStatus.ACTIVE
    ? 'active'
    : 'archived'
}

function locationStatus(
  value: PrismaChronicleLocationStatus,
): 'active' | 'archived' {
  return value ===
    PrismaChronicleLocationStatus.ACTIVE
    ? 'active'
    : 'archived'
}

function invalidReference(
  kind: ChronicleSessionContextResourceKind,
  requestedIds: readonly string[],
  foundIds: readonly string[],
): void {
  const found =
    new Set(foundIds)

  const missing =
    requestedIds.find(
      (id) => !found.has(id),
    )

  if (missing !== undefined) {
    throw new ChronicleSessionContextReferenceError(
      kind,
      missing,
    )
  }
}

function sortEvents(
  items: readonly ChronicleSessionContextEvent[],
): readonly ChronicleSessionContextEvent[] {
  return [...items].sort(
    (left, right) =>
      left.timelineOrder -
        right.timelineOrder ||
      left.title.localeCompare(
        right.title,
        'es',
      ) ||
      left.id.localeCompare(right.id),
  )
}

function sortNpcs(
  items: readonly ChronicleSessionContextNpc[],
): readonly ChronicleSessionContextNpc[] {
  return [...items].sort(
    (left, right) =>
      left.name.localeCompare(
        right.name,
        'es',
      ) ||
      left.id.localeCompare(right.id),
  )
}

function sortLocations(
  items:
    readonly ChronicleSessionContextLocation[],
): readonly ChronicleSessionContextLocation[] {
  return [...items].sort(
    (left, right) =>
      left.name.localeCompare(
        right.name,
        'es',
      ) ||
      left.id.localeCompare(right.id),
  )
}

@Injectable()
export class PrismaChronicleSessionContextRepository
  implements ChronicleSessionContextRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async findBySessionId(
    chronicleId: string,
    sessionId: string,
  ): Promise<ChronicleSessionContext | null> {
    const session =
      await this.database.chronicleSession.findFirst({
        where: {
          id: sessionId,
          chronicleId,
        },
        select: {
          id: true,
        },
      })

    if (session === null) {
      return null
    }

    const [
      eventLinks,
      npcLinks,
      locationLinks,
    ] = await Promise.all([
      this.database.chronicleSessionEvent.findMany({
        where: {
          sessionId,
        },
        select: {
          event: {
            select: {
              id: true,
              title: true,
              status: true,
              narrativeTimeLabel: true,
              realDate: true,
              timelineOrder: true,
            },
          },
        },
      }),
      this.database.chronicleSessionNpc.findMany({
        where: {
          sessionId,
        },
        select: {
          npc: {
            select: {
              id: true,
              name: true,
              status: true,
              category: true,
              narrativeRole: true,
            },
          },
        },
      }),
      this.database.chronicleSessionLocation.findMany({
        where: {
          sessionId,
        },
        select: {
          location: {
            select: {
              id: true,
              name: true,
              status: true,
              category: true,
              parentLocationId: true,
            },
          },
        },
      }),
    ])

    return {
      sessionId: session.id,
      events:
        sortEvents(
          eventLinks.map(
            ({ event }) => ({
              id: event.id,
              title: event.title,
              status:
                eventStatus(
                  event.status,
                ),
              narrativeTimeLabel:
                event.narrativeTimeLabel,
              realDate:
                event.realDate === null
                  ? null
                  : new Date(
                      event.realDate,
                    ),
              timelineOrder:
                event.timelineOrder,
            }),
          ),
        ),
      npcs:
        sortNpcs(
          npcLinks.map(
            ({ npc }) => ({
              id: npc.id,
              name: npc.name,
              status:
                npcStatus(npc.status),
              category: npc.category,
              narrativeRole:
                npc.narrativeRole,
            }),
          ),
        ),
      locations:
        sortLocations(
          locationLinks.map(
            ({ location }) => ({
              id: location.id,
              name: location.name,
              status:
                locationStatus(
                  location.status,
                ),
              category:
                location.category,
              parentLocationId:
                location.parentLocationId,
            }),
          ),
        ),
    }
  }

  async replace(
    data: ReplaceChronicleSessionContextData,
  ): Promise<ChronicleSessionContext | null> {
    return this.database.$transaction(
      async (transaction) => {
        const session =
          await transaction.chronicleSession.findFirst({
            where: {
              id: data.sessionId,
              chronicleId:
                data.chronicleId,
            },
            select: {
              id: true,
              status: true,
            },
          })

        if (session === null) {
          return null
        }

        if (
          session.status ===
          PrismaChronicleSessionStatus.ARCHIVED
        ) {
          throw new ChronicleSessionContextNotEditableError(
            data.sessionId,
          )
        }

        const [
          events,
          npcs,
          locations,
        ] = await Promise.all([
          transaction.chronicleEvent.findMany({
            where: {
              chronicleId:
                data.chronicleId,
              id: {
                in: [...data.eventIds],
              },
            },
            select: {
              id: true,
              title: true,
              status: true,
              narrativeTimeLabel: true,
              realDate: true,
              timelineOrder: true,
            },
          }),
          transaction.chronicleNpc.findMany({
            where: {
              chronicleId:
                data.chronicleId,
              id: {
                in: [...data.npcIds],
              },
            },
            select: {
              id: true,
              name: true,
              status: true,
              category: true,
              narrativeRole: true,
            },
          }),
          transaction.chronicleLocation.findMany({
            where: {
              chronicleId:
                data.chronicleId,
              id: {
                in: [...data.locationIds],
              },
            },
            select: {
              id: true,
              name: true,
              status: true,
              category: true,
              parentLocationId: true,
            },
          }),
        ])

        invalidReference(
          'event',
          data.eventIds,
          events.map(
            (event) => event.id,
          ),
        )
        invalidReference(
          'npc',
          data.npcIds,
          npcs.map(
            (npc) => npc.id,
          ),
        )
        invalidReference(
          'location',
          data.locationIds,
          locations.map(
            (location) => location.id,
          ),
        )

        await Promise.all([
          transaction.chronicleSessionEvent.deleteMany({
            where: {
              sessionId:
                data.sessionId,
            },
          }),
          transaction.chronicleSessionNpc.deleteMany({
            where: {
              sessionId:
                data.sessionId,
            },
          }),
          transaction.chronicleSessionLocation.deleteMany({
            where: {
              sessionId:
                data.sessionId,
            },
          }),
        ])

        if (data.eventIds.length > 0) {
          await transaction.chronicleSessionEvent.createMany({
            data:
              data.eventIds.map(
                (eventId) => ({
                  sessionId:
                    data.sessionId,
                  eventId,
                }),
              ),
          })
        }

        if (data.npcIds.length > 0) {
          await transaction.chronicleSessionNpc.createMany({
            data:
              data.npcIds.map(
                (npcId) => ({
                  sessionId:
                    data.sessionId,
                  npcId,
                }),
              ),
          })
        }

        if (
          data.locationIds.length > 0
        ) {
          await transaction.chronicleSessionLocation.createMany({
            data:
              data.locationIds.map(
                (locationId) => ({
                  sessionId:
                    data.sessionId,
                  locationId,
                }),
              ),
          })
        }

        return {
          sessionId:
            session.id,
          events:
            sortEvents(
              events.map(
                (event) => ({
                  id: event.id,
                  title:
                    event.title,
                  status:
                    eventStatus(
                      event.status,
                    ),
                  narrativeTimeLabel:
                    event.narrativeTimeLabel,
                  realDate:
                    event.realDate ===
                    null
                      ? null
                      : new Date(
                          event.realDate,
                        ),
                  timelineOrder:
                    event.timelineOrder,
                }),
              ),
            ),
          npcs:
            sortNpcs(
              npcs.map(
                (npc) => ({
                  id: npc.id,
                  name: npc.name,
                  status:
                    npcStatus(
                      npc.status,
                    ),
                  category:
                    npc.category,
                  narrativeRole:
                    npc.narrativeRole,
                }),
              ),
            ),
          locations:
            sortLocations(
              locations.map(
                (location) => ({
                  id:
                    location.id,
                  name:
                    location.name,
                  status:
                    locationStatus(
                      location.status,
                    ),
                  category:
                    location.category,
                  parentLocationId:
                    location.parentLocationId,
                }),
              ),
            ),
        }
      },
    )
  }
}
