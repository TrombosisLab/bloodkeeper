import {
  Injectable,
} from '@nestjs/common'
import {
  CharacterExperienceComponent as PrismaExperienceComponent,
  CharacterExperienceMovementType as PrismaExperienceMovementType,
  ChronicleSessionStatus as PrismaSessionStatus,
  ChronicleStatus as PrismaChronicleStatus,
  ChronicleStoryMilestoneKey as PrismaMilestoneKey,
  ChronicleStoryStatus as PrismaStoryStatus,
  ChronicleStoryType as PrismaStoryType,
  ChronicleStoryVisibility as PrismaStoryVisibility,
} from '@prisma/client'
import type {
  Prisma,
} from '@prisma/client'

import {
  offsetPageFromRows,
} from '../../common/offset-pagination'
import {
  DatabaseService,
} from '../../database/database.service'
import {
  CHRONICLE_STORY_MILESTONES,
} from '../domain/chronicle-story.rules'
import type {
  ChronicleStoryMilestoneKey,
  ChronicleStoryMilestoneSnapshot,
  ChronicleStoryReminderSnapshot,
  ChronicleStorySnapshot,
  ChronicleStoryStatus,
  ChronicleStoryType,
  ChronicleStoryVisibility,
  CompleteChronicleStoryData,
  CreateChronicleStoryData,
  CreateChronicleStoryReminderData,
  RemoveChronicleStoryReminderData,
  ReplaceChronicleStoryContextData,
  TransitionChronicleStoryData,
  UpdateChronicleStoryData,
  UpdateChronicleStoryMilestoneData,
  UpdateChronicleStoryReminderData,
  UpdateChronicleStorySessionProgressData,
  ChronicleStoryListQuery,
} from '../domain/chronicle-story.types'
import {
  ChronicleStoryContextReferenceError,
  ChronicleStoryCompletionOperationConflictError,
  ChronicleStoryCompletionPreconditionError,
  ChronicleStoryReminderNotFoundError,
  ChronicleStorySessionLinkNotFoundError,
  ChronicleStoryWriteConflictError,
} from '../application/chronicle-story.repository'
import type {
  ChronicleStoryRepository,
} from '../application/chronicle-story.repository'

const statusFromPrisma = {
  [PrismaStoryStatus.PLANNED]: 'planned',
  [PrismaStoryStatus.ACTIVE]: 'active',
  [PrismaStoryStatus.COMPLETED]: 'completed',
  [PrismaStoryStatus.ARCHIVED]: 'archived',
} as const satisfies Record<
  PrismaStoryStatus,
  ChronicleStoryStatus
>

const statusToPrisma = {
  planned: PrismaStoryStatus.PLANNED,
  active: PrismaStoryStatus.ACTIVE,
  completed: PrismaStoryStatus.COMPLETED,
  archived: PrismaStoryStatus.ARCHIVED,
} as const satisfies Record<
  ChronicleStoryStatus,
  PrismaStoryStatus
>

const typeFromPrisma = {
  [PrismaStoryType.MAIN_ARC]: 'main_arc',
  [PrismaStoryType.SECONDARY_ARC]: 'secondary_arc',
  [PrismaStoryType.PERSONAL_ARC]: 'personal_arc',
} as const satisfies Record<
  PrismaStoryType,
  ChronicleStoryType
>

const typeToPrisma = {
  main_arc: PrismaStoryType.MAIN_ARC,
  secondary_arc: PrismaStoryType.SECONDARY_ARC,
  personal_arc: PrismaStoryType.PERSONAL_ARC,
} as const satisfies Record<
  ChronicleStoryType,
  PrismaStoryType
>

const visibilityFromPrisma = {
  [PrismaStoryVisibility.NARRATOR_ONLY]:
    'narrator_only',
  [PrismaStoryVisibility.CHRONICLE_PARTICIPANTS]:
    'chronicle_participants',
} as const satisfies Record<
  PrismaStoryVisibility,
  ChronicleStoryVisibility
>

const visibilityToPrisma = {
  narrator_only:
    PrismaStoryVisibility.NARRATOR_ONLY,
  chronicle_participants:
    PrismaStoryVisibility.CHRONICLE_PARTICIPANTS,
} as const satisfies Record<
  ChronicleStoryVisibility,
  PrismaStoryVisibility
>

const milestoneFromPrisma = {
  [PrismaMilestoneKey.HOOK]: 'hook',
  [PrismaMilestoneKey.FIRST_TURN]:
    'first_turn',
  [PrismaMilestoneKey.REVELATION]:
    'revelation',
  [PrismaMilestoneKey.CLIMAX]: 'climax',
  [PrismaMilestoneKey.RESOLUTION]:
    'resolution',
} as const satisfies Record<
  PrismaMilestoneKey,
  ChronicleStoryMilestoneKey
>

const milestoneToPrisma = {
  hook: PrismaMilestoneKey.HOOK,
  first_turn: PrismaMilestoneKey.FIRST_TURN,
  revelation: PrismaMilestoneKey.REVELATION,
  climax: PrismaMilestoneKey.CLIMAX,
  resolution: PrismaMilestoneKey.RESOLUTION,
} as const satisfies Record<
  ChronicleStoryMilestoneKey,
  PrismaMilestoneKey
>

const storyDetails = {
  milestones: {
    orderBy: [
      { sortOrder: 'asc' },
      { id: 'asc' },
    ],
  },
  reminders: {
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'asc' },
      { id: 'asc' },
    ],
  },
  sessionLinks: {
    include: {
      session: {
        include: {
          attendances: {
            where: { removedAt: null },
            include: {
              character: {
                select: {
                  id: true,
                  chronicleId: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [
      { session: { sessionNumber: 'asc' } },
      { createdAt: 'asc' },
      { sessionId: 'asc' },
    ],
  },
  eventLinks: {
    include: { event: true },
    orderBy: [
      { event: { timelineOrder: 'asc' } },
      { createdAt: 'asc' },
      { eventId: 'asc' },
    ],
  },
  characterLinks: {
    orderBy: [
      { createdAt: 'asc' },
      { characterId: 'asc' },
    ],
  },
  npcLinks: {
    include: { npc: true },
    orderBy: [
      { createdAt: 'asc' },
      { npcId: 'asc' },
    ],
  },
  locationLinks: {
    include: { location: true },
    orderBy: [
      { createdAt: 'asc' },
      { locationId: 'asc' },
    ],
  },
  completionOperation: true,
} satisfies Prisma.ChronicleStoryInclude

type StoryRow =
  Prisma.ChronicleStoryGetPayload<{
    include: typeof storyDetails
  }>

function milestoneToDomain(
  row: StoryRow['milestones'][number],
): ChronicleStoryMilestoneSnapshot {
  return {
    id: row.id,
    storyId: row.storyId,
    chronicleId: row.chronicleId,
    key: milestoneFromPrisma[row.key],
    sortOrder: row.sortOrder,
    note: row.note,
    completedAt:
      row.completedAt === null
        ? null
        : new Date(row.completedAt),
    completedById: row.completedById,
    revision: row.revision,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

function reminderToDomain(
  row: StoryRow['reminders'][number],
): ChronicleStoryReminderSnapshot {
  return {
    id: row.id,
    storyId: row.storyId,
    chronicleId: row.chronicleId,
    text: row.text,
    sortOrder: row.sortOrder,
    resolvedAt:
      row.resolvedAt === null
        ? null
        : new Date(row.resolvedAt),
    revision: row.revision,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

function toDomain(
  row: StoryRow,
): ChronicleStorySnapshot {
  const eligibleCharacterIds = new Set(
    row.sessionLinks
      .filter((link) =>
        link.session.status === PrismaSessionStatus.COMPLETED ||
        link.session.status === PrismaSessionStatus.ARCHIVED,
      )
      .flatMap((link) => link.session.attendances)
      .filter((attendance) =>
        attendance.character.chronicleId === row.chronicleId,
      )
      .map((attendance) => attendance.characterId),
  )

  return {
    id: row.id,
    chronicleId: row.chronicleId,
    createdById: row.createdById,
    title: row.title,
    type: typeFromPrisma[row.type],
    premise: row.premise,
    stakes: row.stakes,
    resolution: row.resolution,
    narratorNotes: row.narratorNotes,
    sharedSummary: row.sharedSummary,
    visibility:
      visibilityFromPrisma[row.visibility],
    status: statusFromPrisma[row.status],
    sortOrder: row.sortOrder,
    revision: row.revision,
    startedAt:
      row.startedAt === null
        ? null
        : new Date(row.startedAt),
    completedAt:
      row.completedAt === null
        ? null
        : new Date(row.completedAt),
    archivedAt:
      row.archivedAt === null
        ? null
        : new Date(row.archivedAt),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    milestones:
      row.milestones.map(
        milestoneToDomain,
      ),
    reminders:
      row.reminders.map(
        reminderToDomain,
      ),
    sessions: row.sessionLinks.map((link) => ({
      id: link.session.id,
      sessionNumber: link.session.sessionNumber,
      title: link.session.title,
      realDate: link.session.realDate === null
        ? null
        : new Date(link.session.realDate),
      status: link.session.status.toLowerCase(),
      progressNotes: link.progressNotes,
    })),
    events: row.eventLinks.map((link) => ({
      id: link.event.id,
      title: link.event.title,
      status: link.event.status.toLowerCase(),
      narrativeTimeLabel: link.event.narrativeTimeLabel,
      realDate: link.event.realDate === null
        ? null
        : new Date(link.event.realDate),
      timelineOrder: link.event.timelineOrder,
    })),
    characters: row.characterLinks.map((link) => ({
      id: link.characterId,
    })),
    npcs: row.npcLinks.map((link) => ({
      id: link.npc.id,
      name: link.npc.name,
      status: link.npc.status.toLowerCase(),
      category: link.npc.category,
      narrativeRole: link.npc.narrativeRole,
    })),
    locations: row.locationLinks.map((link) => ({
      id: link.location.id,
      name: link.location.name,
      status: link.location.status.toLowerCase(),
      category: link.location.category,
      parentLocationId: link.location.parentLocationId,
    })),
    closure: {
      hasEligibleSession: row.sessionLinks.some((link) =>
        link.session.status === PrismaSessionStatus.COMPLETED ||
        link.session.status === PrismaSessionStatus.ARCHIVED,
      ),
      hasPreparationSession: row.sessionLinks.some((link) =>
        link.session.status === PrismaSessionStatus.PREPARATION,
      ),
      eligibleCharacterCount: eligibleCharacterIds.size,
      excludedCharacters: row.characterLinks
        .filter((link) => !eligibleCharacterIds.has(link.characterId))
        .map((link) => ({
          characterId: link.characterId,
          reason: 'no_eligible_attendance' as const,
        })),
      completion: row.completionOperation === null
        ? null
        : {
            operationId: row.completionOperation.operationId,
            eligibleCount: row.completionOperation.eligibleCount,
            grantedCount: row.completionOperation.grantedCount,
            skippedCount: row.completionOperation.skippedCount,
            completedAt: new Date(row.completionOperation.completedAt),
          },
    },
  }
}

function mutableStoryWhere(
  chronicleId: string,
  storyId: string,
  expectedRevision: number,
): Prisma.ChronicleStoryWhereInput {
  return {
    id: storyId,
    chronicleId,
    revision: expectedRevision,
    status: {
      in: [
        PrismaStoryStatus.PLANNED,
        PrismaStoryStatus.ACTIVE,
      ],
    },
  }
}

@Injectable()
export class PrismaChronicleStoryRepository
  implements ChronicleStoryRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async listByChronicleId(
    chronicleId: string,
    query: ChronicleStoryListQuery,
  ) {
    const rows =
      await this.database.chronicleStory.findMany({
        where: {
          chronicleId,
          ...(query.status === undefined
            ? {}
            : {
                status:
                  statusToPrisma[
                    query.status
                  ],
              }),
          ...(query.title === undefined
            ? {}
            : {
                title: {
                  contains: query.title,
                  mode: 'insensitive',
                },
              }),
        },
        include: storyDetails,
        orderBy: [
          { status: 'asc' },
          { sortOrder: 'asc' },
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

  async listSharedByChronicleId(
    chronicleId: string,
    query: ChronicleStoryListQuery,
  ) {
    const rows =
      await this.database.chronicleStory.findMany({
        where: {
          chronicleId,
          visibility:
            PrismaStoryVisibility.CHRONICLE_PARTICIPANTS,
          ...(query.status === undefined
            ? {}
            : {
                status:
                  statusToPrisma[
                    query.status
                  ],
              }),
          ...(query.title === undefined
            ? {}
            : {
                title: {
                  contains: query.title,
                  mode: 'insensitive',
                },
              }),
        },
        include: storyDetails,
        orderBy: [
          { status: 'asc' },
          { sortOrder: 'asc' },
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

  async findById(
    chronicleId: string,
    storyId: string,
  ): Promise<ChronicleStorySnapshot | null> {
    const row =
      await this.database.chronicleStory.findFirst({
        where: {
          id: storyId,
          chronicleId,
        },
        include: storyDetails,
      })

    return row === null
      ? null
      : toDomain(row)
  }

  async create(
    data: CreateChronicleStoryData,
  ): Promise<ChronicleStorySnapshot> {
    const row =
      await this.database.$transaction(
        async (transaction) => {
          const order =
            await transaction.chronicleStory.aggregate({
              where: {
                chronicleId: data.chronicleId,
              },
              _max: {
                sortOrder: true,
              },
            })

          return transaction.chronicleStory.create({
            data: {
              chronicleId: data.chronicleId,
              createdById: data.createdById,
              title: data.title,
              type: typeToPrisma[data.type],
              premise: data.premise,
              stakes: data.stakes,
              narratorNotes:
                data.narratorNotes,
              sharedSummary:
                data.sharedSummary,
              visibility:
                visibilityToPrisma[
                  data.visibility
                ],
              sortOrder:
                (order._max.sortOrder ?? -1) + 1,
              milestones: {
                create:
                  CHRONICLE_STORY_MILESTONES.map(
                    (milestone) => ({
                      key:
                        milestoneToPrisma[
                          milestone.key
                        ],
                      sortOrder:
                        milestone.sortOrder,
                    }),
                  ),
              },
            },
            include: storyDetails,
          })
        },
      )

    return toDomain(row)
  }

  async update(
    data: UpdateChronicleStoryData,
  ): Promise<ChronicleStorySnapshot> {
    const updated =
      await this.database.chronicleStory.updateMany({
        where: mutableStoryWhere(
          data.chronicleId,
          data.storyId,
          data.expectedRevision,
        ),
        data: {
          ...(data.title === undefined
            ? {}
            : { title: data.title }),
          ...(data.type === undefined
            ? {}
            : {
                type:
                  typeToPrisma[data.type],
              }),
          ...(data.premise === undefined
            ? {}
            : { premise: data.premise }),
          ...(data.stakes === undefined
            ? {}
            : { stakes: data.stakes }),
          ...(data.narratorNotes === undefined
            ? {}
            : {
                narratorNotes:
                  data.narratorNotes,
              }),
          ...(data.sharedSummary === undefined
            ? {}
            : {
                sharedSummary:
                  data.sharedSummary,
              }),
          ...(data.visibility === undefined
            ? {}
            : {
                visibility:
                  visibilityToPrisma[
                    data.visibility
                  ],
              }),
          revision: {
            increment: 1,
          },
        },
      })

    if (updated.count !== 1) {
      throw new ChronicleStoryWriteConflictError(
        data.storyId,
      )
    }

    return this.requiredStory(
      data.chronicleId,
      data.storyId,
    )
  }

  async transition(
    data: TransitionChronicleStoryData,
  ): Promise<ChronicleStorySnapshot> {
    const allowed =
      data.to === 'active'
        ? [PrismaStoryStatus.PLANNED]
        : [
            PrismaStoryStatus.PLANNED,
            PrismaStoryStatus.ACTIVE,
            PrismaStoryStatus.COMPLETED,
          ]

    const updated =
      await this.database.chronicleStory.updateMany({
        where: {
          id: data.storyId,
          chronicleId: data.chronicleId,
          revision: data.expectedRevision,
          status: {
            in: allowed,
          },
        },
        data: {
          status:
            statusToPrisma[data.to],
          ...(data.to === 'active'
            ? { startedAt: new Date() }
            : { archivedAt: new Date() }),
          revision: {
            increment: 1,
          },
        },
      })

    if (updated.count !== 1) {
      throw new ChronicleStoryWriteConflictError(
        data.storyId,
      )
    }

    return this.requiredStory(
      data.chronicleId,
      data.storyId,
    )
  }

  async updateMilestone(
    data: UpdateChronicleStoryMilestoneData,
  ): Promise<ChronicleStorySnapshot> {
    return this.database.$transaction(
      async (transaction) => {
        await this.incrementMutableStory(
          transaction,
          data.chronicleId,
          data.storyId,
          data.expectedRevision,
        )

        const updated =
          await transaction.chronicleStoryMilestone.updateMany({
            where: {
              storyId: data.storyId,
              chronicleId: data.chronicleId,
              key:
                milestoneToPrisma[data.key],
            },
            data: {
              ...(data.note === undefined
                ? {}
                : { note: data.note }),
              completedAt:
                data.completed
                  ? new Date()
                  : null,
              completedById:
                data.completed
                  ? data.actorUserId
                  : null,
              revision: {
                increment: 1,
              },
            },
          })

        if (updated.count !== 1) {
          throw new ChronicleStoryWriteConflictError(
            data.storyId,
          )
        }

        return toDomain(
          await this.requiredStoryInTransaction(
            transaction,
            data.chronicleId,
            data.storyId,
          ),
        )
      },
    )
  }

  async createReminder(
    data: CreateChronicleStoryReminderData,
  ): Promise<ChronicleStorySnapshot> {
    return this.database.$transaction(
      async (transaction) => {
        await this.incrementMutableStory(
          transaction,
          data.chronicleId,
          data.storyId,
          data.expectedRevision,
        )

        const order =
          await transaction.chronicleStoryReminder.aggregate({
            where: {
              storyId: data.storyId,
              chronicleId: data.chronicleId,
            },
            _max: {
              sortOrder: true,
            },
          })

        await transaction.chronicleStoryReminder.create({
          data: {
            storyId: data.storyId,
            chronicleId: data.chronicleId,
            text: data.text,
            sortOrder:
              (order._max.sortOrder ?? -1) + 1,
          },
        })

        return toDomain(
          await this.requiredStoryInTransaction(
            transaction,
            data.chronicleId,
            data.storyId,
          ),
        )
      },
    )
  }

  async updateReminder(
    data: UpdateChronicleStoryReminderData,
  ): Promise<ChronicleStorySnapshot> {
    return this.database.$transaction(
      async (transaction) => {
        await this.incrementMutableStory(
          transaction,
          data.chronicleId,
          data.storyId,
          data.expectedRevision,
        )

        const updated =
          await transaction.chronicleStoryReminder.updateMany({
            where: {
              id: data.reminderId,
              storyId: data.storyId,
              chronicleId: data.chronicleId,
            },
            data: {
              ...(data.text === undefined
                ? {}
                : { text: data.text }),
              ...(data.resolved === undefined
                ? {}
                : {
                    resolvedAt:
                      data.resolved
                        ? new Date()
                        : null,
                  }),
              revision: {
                increment: 1,
              },
            },
          })

        if (updated.count !== 1) {
          throw new ChronicleStoryReminderNotFoundError(
            data.reminderId,
          )
        }

        return toDomain(
          await this.requiredStoryInTransaction(
            transaction,
            data.chronicleId,
            data.storyId,
          ),
        )
      },
    )
  }

  async removeReminder(
    data: RemoveChronicleStoryReminderData,
  ): Promise<ChronicleStorySnapshot> {
    return this.database.$transaction(
      async (transaction) => {
        await this.incrementMutableStory(
          transaction,
          data.chronicleId,
          data.storyId,
          data.expectedRevision,
        )

        const removed =
          await transaction.chronicleStoryReminder.deleteMany({
            where: {
              id: data.reminderId,
              storyId: data.storyId,
              chronicleId: data.chronicleId,
            },
          })

        if (removed.count !== 1) {
          throw new ChronicleStoryReminderNotFoundError(
            data.reminderId,
          )
        }

        return toDomain(
          await this.requiredStoryInTransaction(
            transaction,
            data.chronicleId,
            data.storyId,
          ),
        )
      },
    )
  }

  async replaceContext(
    data: ReplaceChronicleStoryContextData,
  ): Promise<ChronicleStorySnapshot> {
    return this.database.$transaction(async (transaction) => {
      await this.incrementMutableStory(
        transaction,
        data.chronicleId,
        data.storyId,
        data.expectedRevision,
      )

      await this.assertContextReferences(transaction, data)

      await Promise.all([
        transaction.chronicleStorySession.deleteMany({
          where: { storyId: data.storyId, chronicleId: data.chronicleId },
        }),
        transaction.chronicleStoryEvent.deleteMany({
          where: { storyId: data.storyId, chronicleId: data.chronicleId },
        }),
        transaction.chronicleStoryCharacter.deleteMany({
          where: { storyId: data.storyId, chronicleId: data.chronicleId },
        }),
        transaction.chronicleStoryNpc.deleteMany({
          where: { storyId: data.storyId, chronicleId: data.chronicleId },
        }),
        transaction.chronicleStoryLocation.deleteMany({
          where: { storyId: data.storyId, chronicleId: data.chronicleId },
        }),
      ])

      await Promise.all([
        data.sessionIds.length === 0
          ? Promise.resolve()
          : transaction.chronicleStorySession.createMany({
              data: data.sessionIds.map((sessionId) => ({
                storyId: data.storyId,
                chronicleId: data.chronicleId,
                sessionId,
              })),
            }),
        data.eventIds.length === 0
          ? Promise.resolve()
          : transaction.chronicleStoryEvent.createMany({
              data: data.eventIds.map((eventId) => ({
                storyId: data.storyId,
                chronicleId: data.chronicleId,
                eventId,
              })),
            }),
        data.characterIds.length === 0
          ? Promise.resolve()
          : transaction.chronicleStoryCharacter.createMany({
              data: data.characterIds.map((characterId) => ({
                storyId: data.storyId,
                chronicleId: data.chronicleId,
                characterId,
              })),
            }),
        data.npcIds.length === 0
          ? Promise.resolve()
          : transaction.chronicleStoryNpc.createMany({
              data: data.npcIds.map((npcId) => ({
                storyId: data.storyId,
                chronicleId: data.chronicleId,
                npcId,
              })),
            }),
        data.locationIds.length === 0
          ? Promise.resolve()
          : transaction.chronicleStoryLocation.createMany({
              data: data.locationIds.map((locationId) => ({
                storyId: data.storyId,
                chronicleId: data.chronicleId,
                locationId,
              })),
            }),
      ])

      return toDomain(await this.requiredStoryInTransaction(
        transaction,
        data.chronicleId,
        data.storyId,
      ))
    })
  }

  async updateSessionProgress(
    data: UpdateChronicleStorySessionProgressData,
  ): Promise<ChronicleStorySnapshot> {
    return this.database.$transaction(async (transaction) => {
      await this.incrementMutableStory(
        transaction,
        data.chronicleId,
        data.storyId,
        data.expectedRevision,
      )
      const updated = await transaction.chronicleStorySession.updateMany({
        where: {
          storyId: data.storyId,
          chronicleId: data.chronicleId,
          sessionId: data.sessionId,
        },
        data: { progressNotes: data.progressNotes },
      })
      if (updated.count !== 1) {
        throw new ChronicleStorySessionLinkNotFoundError(data.sessionId)
      }
      return toDomain(await this.requiredStoryInTransaction(
        transaction,
        data.chronicleId,
        data.storyId,
      ))
    })
  }

  async complete(
    data: CompleteChronicleStoryData,
  ): Promise<ChronicleStorySnapshot> {
    return this.database.$transaction(async (transaction) => {
      const previousOperation =
        await transaction.chronicleStoryCompletionOperation.findUnique({
          where: { operationId: data.operationId },
          select: { storyId: true },
        })

      if (previousOperation !== null) {
        if (previousOperation.storyId !== data.storyId) {
          throw new ChronicleStoryCompletionOperationConflictError(
            data.operationId,
          )
        }
        return toDomain(await this.requiredStoryInTransaction(
          transaction,
          data.chronicleId,
          data.storyId,
        ))
      }

      const story = await transaction.chronicleStory.findFirst({
        where: { id: data.storyId, chronicleId: data.chronicleId },
        include: storyDetails,
      })
      if (story === null) {
        throw new ChronicleStoryWriteConflictError(data.storyId)
      }
      if (story.completionOperation !== null) {
        throw new ChronicleStoryCompletionPreconditionError('already_completed')
      }

      const chronicle = await transaction.chronicle.findFirst({
        where: {
          id: data.chronicleId,
          status: PrismaChronicleStatus.ACTIVE,
        },
        select: { id: true },
      })
      if (chronicle === null) {
        throw new ChronicleStoryCompletionPreconditionError('chronicle_not_active')
      }
      if (story.status !== PrismaStoryStatus.ACTIVE) {
        throw new ChronicleStoryCompletionPreconditionError('story_not_active')
      }
      if (data.resolution.trim().length === 0) {
        throw new ChronicleStoryCompletionPreconditionError('resolution_required')
      }
      if (story.sessionLinks.some((link) =>
        link.session.status === PrismaSessionStatus.PREPARATION,
      )) {
        throw new ChronicleStoryCompletionPreconditionError('preparation_sessions_linked')
      }

      const eligibleSessionIds = story.sessionLinks
        .filter((link) =>
          link.session.status === PrismaSessionStatus.COMPLETED ||
          link.session.status === PrismaSessionStatus.ARCHIVED,
        )
        .map((link) => link.sessionId)
      if (eligibleSessionIds.length === 0) {
        throw new ChronicleStoryCompletionPreconditionError('eligible_session_required')
      }

      const completedAt = new Date()
      const claimed = await transaction.chronicleStory.updateMany({
        where: {
          id: data.storyId,
          chronicleId: data.chronicleId,
          revision: data.expectedRevision,
          status: PrismaStoryStatus.ACTIVE,
        },
        data: {
          status: PrismaStoryStatus.COMPLETED,
          resolution: data.resolution,
          completedAt,
          revision: { increment: 1 },
        },
      })
      if (claimed.count !== 1) {
        throw new ChronicleStoryWriteConflictError(data.storyId)
      }

      const attendanceRows =
        await transaction.chronicleSessionAttendance.findMany({
          where: {
            sessionId: { in: eligibleSessionIds },
            removedAt: null,
            character: { chronicleId: data.chronicleId },
          },
          select: { characterId: true },
          distinct: ['characterId'],
        })
      const eligibleCharacterIds = attendanceRows.map((row) => row.characterId)
      const existingMovements = eligibleCharacterIds.length === 0
        ? []
        : await transaction.characterExperienceMovement.findMany({
            where: {
              storyId: data.storyId,
              characterId: { in: eligibleCharacterIds },
            },
            select: { characterId: true },
          })
      const alreadyGranted = new Set(
        existingMovements.map((movement) => movement.characterId),
      )
      const grantCharacterIds = eligibleCharacterIds.filter(
        (characterId) => !alreadyGranted.has(characterId),
      )

      const grants = grantCharacterIds.length === 0
        ? { count: 0 }
        : await transaction.characterExperienceMovement.createMany({
            data: grantCharacterIds.map((characterId) => ({
              characterId,
              actorId: data.actorUserId,
              sessionId: null,
              storyId: data.storyId,
              type: PrismaExperienceMovementType.GRANT,
              component: PrismaExperienceComponent.EARNED,
              amount: 1,
              reason: 'story_end',
              deduplicationKey: `story_end:${data.storyId}:${characterId}`,
            })),
          })
      await transaction.chronicleStoryCompletionOperation.create({
        data: {
          storyId: data.storyId,
          operationId: data.operationId,
          actorId: data.actorUserId,
          eligibleCount: eligibleCharacterIds.length,
          grantedCount: grants.count,
          skippedCount: eligibleCharacterIds.length - grants.count,
          completedAt,
        },
      })

      return toDomain(await this.requiredStoryInTransaction(
        transaction,
        data.chronicleId,
        data.storyId,
      ))
    })
  }

  private async requiredStory(
    chronicleId: string,
    storyId: string,
  ): Promise<ChronicleStorySnapshot> {
    const story =
      await this.findById(
        chronicleId,
        storyId,
      )

    if (story === null) {
      throw new ChronicleStoryWriteConflictError(
        storyId,
      )
    }

    return story
  }

  private async assertContextReferences(
    transaction: Prisma.TransactionClient,
    data: ReplaceChronicleStoryContextData,
  ): Promise<void> {
    const [sessions, events, characters, npcs, locations] = await Promise.all([
      transaction.chronicleSession.findMany({
        where: { id: { in: [...data.sessionIds] }, chronicleId: data.chronicleId },
        select: { id: true },
      }),
      transaction.chronicleEvent.findMany({
        where: { id: { in: [...data.eventIds] }, chronicleId: data.chronicleId },
        select: { id: true },
      }),
      transaction.character.findMany({
        where: { id: { in: [...data.characterIds] }, chronicleId: data.chronicleId },
        select: { id: true },
      }),
      transaction.chronicleNpc.findMany({
        where: { id: { in: [...data.npcIds] }, chronicleId: data.chronicleId },
        select: { id: true },
      }),
      transaction.chronicleLocation.findMany({
        where: { id: { in: [...data.locationIds] }, chronicleId: data.chronicleId },
        select: { id: true },
      }),
    ])

    this.assertAllFound('session', data.sessionIds, sessions)
    this.assertAllFound('event', data.eventIds, events)
    this.assertAllFound('character', data.characterIds, characters)
    this.assertAllFound('npc', data.npcIds, npcs)
    this.assertAllFound('location', data.locationIds, locations)
  }

  private assertAllFound(
    kind: string,
    expectedIds: readonly string[],
    rows: readonly { readonly id: string }[],
  ): void {
    const found = new Set(rows.map((row) => row.id))
    const missing = expectedIds.find((id) => !found.has(id))
    if (missing !== undefined) {
      throw new ChronicleStoryContextReferenceError(kind, missing)
    }
  }

  private async incrementMutableStory(
    transaction: Prisma.TransactionClient,
    chronicleId: string,
    storyId: string,
    expectedRevision: number,
  ): Promise<void> {
    const updated =
      await transaction.chronicleStory.updateMany({
        where: mutableStoryWhere(
          chronicleId,
          storyId,
          expectedRevision,
        ),
        data: {
          revision: {
            increment: 1,
          },
        },
      })

    if (updated.count !== 1) {
      throw new ChronicleStoryWriteConflictError(
        storyId,
      )
    }
  }

  private async requiredStoryInTransaction(
    transaction: Prisma.TransactionClient,
    chronicleId: string,
    storyId: string,
  ): Promise<StoryRow> {
    const row =
      await transaction.chronicleStory.findFirst({
        where: {
          id: storyId,
          chronicleId,
        },
        include: storyDetails,
      })

    if (row === null) {
      throw new ChronicleStoryWriteConflictError(
        storyId,
      )
    }

    return row
  }
}
