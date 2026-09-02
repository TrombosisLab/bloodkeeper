import { Injectable } from '@nestjs/common'
import {
  CharacterStatus,
  ChronicleEventStatus,
  ChronicleLocationStatus,
  ChronicleNpcStatus,
  ChronicleParticipantStatus,
  ChronicleSessionStatus,
  ChronicleStatus,
  ChronicleStoryStatus,
  UserAccountStatus,
} from '@prisma/client'

import { DatabaseService } from '../database/database.service'
import { lifecycleTrashKinds } from './lifecycle-trash.types'
import type {
  LifecycleTrashDependencies,
  LifecycleTrashItem,
  LifecycleTrashKind,
  LifecycleTrashPage,
} from './lifecycle-trash.types'

export class LifecycleTrashNotFoundError extends Error {}

export class LifecycleTrashConflictError extends Error {
  constructor(
    readonly blockers: readonly string[],
  ) {
    super('La operación está bloqueada por dependencias protegidas.')
    this.name = 'LifecycleTrashConflictError'
  }
}

export class LifecycleTrashConfirmationError extends Error {}

function item(
  kind: LifecycleTrashKind,
  id: string,
  label: string,
  status: string,
  context: string | null,
  updatedAt: Date,
): LifecycleTrashItem {
  return {
    kind,
    id,
    label,
    status,
    context,
    updatedAt: updatedAt.toISOString(),
    canRestore: true,
    canPurge: false,
    blockers: [],
  }
}

function positiveCounts(
  counts: Readonly<Record<string, number>>,
): string[] {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => name + ': ' + String(count))
}

@Injectable()
export class LifecycleTrashService {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  async list(input: {
    readonly actorId: string
    readonly kind?: LifecycleTrashKind
    readonly query?: string
    readonly updatedFrom?: Date
    readonly updatedTo?: Date
    readonly limit: number
    readonly offset: number
  }): Promise<LifecycleTrashPage> {
    const [
      users,
      participants,
      chronicles,
      characters,
      stories,
      sessions,
      events,
      npcs,
      locations,
      resources,
    ] = await Promise.all([
      this.database.user.findMany({
        where: { status: UserAccountStatus.DISABLED },
        select: {
          id: true,
          username: true,
          displayName: true,
          updatedAt: true,
        },
      }),
      this.database.chronicleParticipant.findMany({
        where: { status: ChronicleParticipantStatus.RETIRED },
        include: {
          user: { select: { username: true, displayName: true } },
          chronicle: { select: { name: true } },
        },
      }),
      this.database.chronicle.findMany({
        where: { status: ChronicleStatus.ARCHIVED },
      }),
      this.database.character.findMany({
        where: { status: CharacterStatus.ARCHIVED },
        include: {
          identity: { select: { name: true } },
          owner: { select: { username: true } },
        },
      }),
      this.database.chronicleStory.findMany({
        where: { status: ChronicleStoryStatus.ARCHIVED },
        include: { chronicle: { select: { name: true } } },
      }),
      this.database.chronicleSession.findMany({
        where: { status: ChronicleSessionStatus.ARCHIVED },
        include: { chronicle: { select: { name: true } } },
      }),
      this.database.chronicleEvent.findMany({
        where: { status: ChronicleEventStatus.ARCHIVED },
        include: { chronicle: { select: { name: true } } },
      }),
      this.database.chronicleNpc.findMany({
        where: { status: ChronicleNpcStatus.ARCHIVED },
        include: { chronicle: { select: { name: true } } },
      }),
      this.database.chronicleLocation.findMany({
        where: { status: ChronicleLocationStatus.ARCHIVED },
        include: { chronicle: { select: { name: true } } },
      }),
      this.database.chronicleResource.findMany({
        where: { status: 'archived' },
        include: { chronicle: { select: { name: true } } },
      }),
    ])

    const rows: LifecycleTrashItem[] = [
      ...users.map((value) => item(
        'user', value.id, value.displayName, 'disabled',
        '@' + value.username, value.updatedAt,
      )),
      ...participants.map((value) => item(
        'participant', value.id, value.user.displayName, 'retired',
        value.chronicle.name + ' · @' + value.user.username,
        value.updatedAt,
      )),
      ...chronicles.map((value) => item(
        'chronicle', value.id, value.name, 'archived', null,
        value.updatedAt,
      )),
      ...characters.map((value) => item(
        'character', value.id,
        value.identity?.name.trim() || 'Personaje sin nombre',
        'archived', '@' + value.owner.username, value.updatedAt,
      )),
      ...stories.map((value) => item(
        'story', value.id, value.title, 'archived',
        value.chronicle.name, value.updatedAt,
      )),
      ...sessions.map((value) => item(
        'session', value.id,
        value.title?.trim() || 'Sesión ' + String(value.sessionNumber ?? 'sin número'),
        'archived', value.chronicle.name, value.updatedAt,
      )),
      ...events.map((value) => item(
        'event', value.id, value.title, 'archived',
        value.chronicle.name, value.updatedAt,
      )),
      ...npcs.map((value) => item(
        'npc', value.id, value.name, 'archived',
        value.chronicle.name, value.updatedAt,
      )),
      ...locations.map((value) => item(
        'location', value.id, value.name, 'archived',
        value.chronicle.name, value.updatedAt,
      )),
      ...resources.map((value) => item(
        'resource', value.id, value.name, 'archived',
        value.chronicle.name, value.updatedAt,
      )),
    ]

    const query = input.query?.trim().toLocaleLowerCase('es') ?? ''
    const filtered = rows
      .filter((value) => input.kind === undefined || value.kind === input.kind)
      .filter((value) => query.length === 0 ||
        value.label.toLocaleLowerCase('es').includes(query) ||
        (value.context?.toLocaleLowerCase('es').includes(query) ?? false))
      .filter((value) => input.updatedFrom === undefined || value.updatedAt >= input.updatedFrom.toISOString())
      .filter((value) => input.updatedTo === undefined || value.updatedAt <= input.updatedTo.toISOString())
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

    const page = filtered.slice(input.offset, input.offset + input.limit + 1)
    const visible = page.slice(0, input.limit)
    const items = await Promise.all(visible.map(async (value) => {
      const dependencies = await this.dependencies(input.actorId, value.kind, value.id)
      return {
        ...value,
        canRestore: dependencies.canRestore,
        canPurge: dependencies.canPurge,
        blockers: dependencies.blockers,
      }
    }))
    const counts = Object.fromEntries(
      lifecycleTrashKinds.map((kind) => [
        kind,
        rows.filter((value) => value.kind === kind).length,
      ]),
    ) as Record<LifecycleTrashKind, number>
    return {
      items,
      nextOffset: page.length > input.limit
        ? input.offset + input.limit
        : null,
      counts,
    }
  }

  async dependencies(
    actorId: string,
    kind: LifecycleTrashKind,
    id: string,
  ): Promise<LifecycleTrashDependencies> {
    if (kind === 'user') return this.userDependencies(actorId, id)
    if (kind === 'participant') return this.participantDependencies(id)
    if (kind === 'chronicle') return this.chronicleDependencies(id)
    if (kind === 'character') return this.characterDependencies(id)
    if (kind === 'story') return this.storyDependencies(id)
    if (kind === 'session') return this.sessionDependencies(id)
    if (kind === 'event') return this.simpleDependencies(kind, id)
    if (kind === 'npc') return this.simpleDependencies(kind, id)
    if (kind === 'location') return this.locationDependencies(id)
    return this.simpleDependencies(kind, id)
  }

  private async userDependencies(
    actorId: string,
    id: string,
  ): Promise<LifecycleTrashDependencies> {
    const record = await this.database.user.findUnique({ where: { id } })
    if (record === null) throw new LifecycleTrashNotFoundError()
    const counts = {
      personajes: await this.database.character.count({ where: { ownerId: id } }),
      cronicas: await this.database.chronicle.count({ where: { narratorId: id } }),
      participaciones: await this.database.chronicleParticipant.count({ where: { userId: id } }),
      experiencia: await this.database.characterExperienceMovement.count({ where: { actorId: id } }),
      tiradas: await this.database.diceRollRecord.count({ where: { actorId: id } }),
      operaciones: (
        await this.database.characterRouseCheckOperation.count({ where: { actorId: id } })
      ) + (
        await this.database.characterBlushOfLifeExemptionOperation.count({ where: { actorId: id } })
      ),
      autoria: (
        await this.database.chronicleStory.count({ where: { createdById: id } })
      ) + (
        await this.database.chronicleStoryMilestone.count({ where: { completedById: id } })
      ) + (
        await this.database.chronicleStoryCompletionOperation.count({ where: { actorId: id } })
      ),
    }
    const blockers = positiveCounts(counts)
    if (record.status !== UserAccountStatus.DISABLED) blockers.unshift('La cuenta no está desactivada')
    if (record.id === actorId) blockers.unshift('No puedes eliminar tu propia cuenta')
    if (record.username === 'trombosis' || record.username === 'trombojugador') {
      blockers.unshift('Cuenta fundamental protegida')
    }
    return {
      kind: 'user', id, label: record.displayName,
      canRestore: record.status === UserAccountStatus.DISABLED,
      canPurge: blockers.length === 0,
      blockers, counts,
    }
  }

  private async participantDependencies(id: string): Promise<LifecycleTrashDependencies> {
    const record = await this.database.chronicleParticipant.findUnique({
      where: { id },
      include: { user: true, chronicle: true },
    })
    if (record === null) throw new LifecycleTrashNotFoundError()
    const blockers = ['Las participaciones conservan trazabilidad y no se purgan por separado']
    if (record.user.status !== UserAccountStatus.ACTIVE) blockers.push('La cuenta está desactivada')
    if (record.chronicle.status === ChronicleStatus.ARCHIVED) blockers.push('La crónica está archivada')
    return {
      kind: 'participant', id, label: record.user.displayName,
      canRestore: record.status === ChronicleParticipantStatus.RETIRED && blockers.length === 1,
      canPurge: false, blockers, counts: {},
    }
  }

  private async chronicleDependencies(id: string): Promise<LifecycleTrashDependencies> {
    const record = await this.database.chronicle.findUnique({ where: { id } })
    if (record === null) throw new LifecycleTrashNotFoundError()
    const counts = {
      sesiones_completadas: await this.database.chronicleSession.count({
        where: {
          chronicleId: id,
          OR: [
            { status: ChronicleSessionStatus.COMPLETED },
            { experiencePaceSnapshot: { not: null } },
          ],
        },
      }),
      tiradas: await this.database.diceRollRecord.count({
        where: { OR: [
          { chronicleId: id },
          { session: { chronicleId: id } },
          { character: { chronicleId: id } },
        ] },
      }),
      experiencia: await this.database.characterExperienceMovement.count({
        where: { OR: [
          { character: { chronicleId: id } },
          { session: { chronicleId: id } },
          { story: { chronicleId: id } },
        ] },
      }),
      cierres_de_historia: await this.database.chronicleStoryCompletionOperation.count({
        where: { story: { chronicleId: id } },
      }),
      historias_completadas: await this.database.chronicleStory.count({
        where: { chronicleId: id, completedAt: { not: null } },
      }),
    }
    const blockers = positiveCounts(counts)
    if (record.status !== ChronicleStatus.ARCHIVED) blockers.unshift('La crónica no está archivada')
    return {
      kind: 'chronicle', id, label: record.name,
      canRestore: record.status === ChronicleStatus.ARCHIVED,
      canPurge: blockers.length === 0, blockers, counts,
    }
  }

  private async characterDependencies(id: string): Promise<LifecycleTrashDependencies> {
    const record = await this.database.character.findUnique({
      where: { id }, include: { identity: true, chronicle: { select: { status: true } } },
    })
    if (record === null) throw new LifecycleTrashNotFoundError()
    const counts = {
      experiencia: await this.database.characterExperienceMovement.count({ where: { characterId: id } }),
      tiradas: await this.database.diceRollRecord.count({ where: { characterId: id } }),
      asistencias: await this.database.chronicleSessionAttendance.count({ where: { characterId: id } }),
      operaciones_de_sangre: (
        await this.database.characterBloodResonanceOperation.count({ where: { characterId: id } })
      ) + (
        await this.database.characterRouseCheckOperation.count({ where: { characterId: id } })
      ) + (
        await this.database.characterBlushOfLifeExemptionOperation.count({ where: { characterId: id } })
      ),
    }
    const blockers = positiveCounts(counts)
    if (record.status !== CharacterStatus.ARCHIVED) blockers.unshift('El personaje no está archivado')
    return {
      kind: 'character', id,
      label: record.identity?.name.trim() || 'Personaje sin nombre',
      canRestore: record.status === CharacterStatus.ARCHIVED && record.chronicle?.status !== ChronicleStatus.ARCHIVED,
      canPurge: blockers.length === 0, blockers, counts,
    }
  }

  private async storyDependencies(id: string): Promise<LifecycleTrashDependencies> {
    const record = await this.database.chronicleStory.findUnique({
      where: { id }, include: { chronicle: { select: { status: true } } },
    })
    if (record === null) throw new LifecycleTrashNotFoundError()
    const counts = {
      finalizada: record.completedAt === null ? 0 : 1,
      experiencia: await this.database.characterExperienceMovement.count({ where: { storyId: id } }),
      cierre: await this.database.chronicleStoryCompletionOperation.count({ where: { storyId: id } }),
    }
    const blockers = positiveCounts(counts)
    if (record.status !== ChronicleStoryStatus.ARCHIVED) blockers.unshift('La historia no está archivada')
    return {
      kind: 'story', id, label: record.title,
      canRestore: record.status === ChronicleStoryStatus.ARCHIVED && record.chronicle.status !== ChronicleStatus.ARCHIVED,
      canPurge: blockers.length === 0, blockers, counts,
    }
  }

  private async sessionDependencies(id: string): Promise<LifecycleTrashDependencies> {
    const record = await this.database.chronicleSession.findUnique({
      where: { id }, include: { chronicle: { select: { status: true } } },
    })
    if (record === null) throw new LifecycleTrashNotFoundError()
    const counts = {
      finalizada: record.experiencePaceSnapshot === null ? 0 : 1,
      experiencia: await this.database.characterExperienceMovement.count({ where: { sessionId: id } }),
      tiradas: await this.database.diceRollRecord.count({ where: { sessionId: id } }),
    }
    const blockers = positiveCounts(counts)
    if (record.status !== ChronicleSessionStatus.ARCHIVED) blockers.unshift('La sesión no está archivada')
    return {
      kind: 'session', id,
      label: record.title?.trim() || 'Sesión ' + String(record.sessionNumber ?? 'sin número'),
      canRestore: record.status === ChronicleSessionStatus.ARCHIVED && record.chronicle.status !== ChronicleStatus.ARCHIVED,
      canPurge: blockers.length === 0, blockers, counts,
    }
  }

  private async locationDependencies(id: string): Promise<LifecycleTrashDependencies> {
    const record = await this.database.chronicleLocation.findUnique({
      where: { id },
      include: {
        chronicle: { select: { status: true } },
        parentLocation: { select: { status: true } },
      },
    })
    if (record === null) throw new LifecycleTrashNotFoundError()
    const counts = {
      localizaciones_hijas: await this.database.chronicleLocation.count({ where: { parentLocationId: id } }),
    }
    const blockers = positiveCounts(counts)
    if (record.status !== ChronicleLocationStatus.ARCHIVED) blockers.unshift('La localización no está archivada')
    return {
      kind: 'location', id, label: record.name,
      canRestore: record.status === ChronicleLocationStatus.ARCHIVED &&
        record.chronicle.status !== ChronicleStatus.ARCHIVED &&
        record.parentLocation?.status !== ChronicleLocationStatus.ARCHIVED,
      canPurge: blockers.length === 0, blockers, counts,
    }
  }

  private async simpleDependencies(
    kind: 'event' | 'npc' | 'resource',
    id: string,
  ): Promise<LifecycleTrashDependencies> {
    if (kind === 'event') {
      const record = await this.database.chronicleEvent.findUnique({
        where: { id }, include: { chronicle: { select: { status: true } } },
      })
      if (record === null) throw new LifecycleTrashNotFoundError()
      const blockers = record.status === ChronicleEventStatus.ARCHIVED ? [] : ['El suceso no está archivado']
      return { kind, id, label: record.title, canRestore: blockers.length === 0 && record.chronicle.status !== ChronicleStatus.ARCHIVED, canPurge: blockers.length === 0, blockers, counts: {} }
    }
    if (kind === 'npc') {
      const record = await this.database.chronicleNpc.findUnique({
        where: { id }, include: { chronicle: { select: { status: true } } },
      })
      if (record === null) throw new LifecycleTrashNotFoundError()
      const blockers = record.status === ChronicleNpcStatus.ARCHIVED ? [] : ['El PNJ no está archivado']
      return { kind, id, label: record.name, canRestore: blockers.length === 0 && record.chronicle.status !== ChronicleStatus.ARCHIVED, canPurge: blockers.length === 0, blockers, counts: {} }
    }
    const record = await this.database.chronicleResource.findUnique({
      where: { id }, include: { chronicle: { select: { status: true } } },
    })
    if (record === null) throw new LifecycleTrashNotFoundError()
    const blockers = record.status === 'archived' ? [] : ['El recurso no está archivado']
    return { kind, id, label: record.name, canRestore: blockers.length === 0 && record.chronicle.status !== ChronicleStatus.ARCHIVED, canPurge: blockers.length === 0, blockers, counts: {} }
  }

  async restore(actorId: string, kind: LifecycleTrashKind, id: string): Promise<void> {
    const check = await this.dependencies(actorId, kind, id)
    if (!check.canRestore) {
      throw new LifecycleTrashConflictError(
        check.blockers.length > 0
          ? check.blockers
          : ['Restaura primero la crónica o el contenedor archivado'],
      )
    }
    if (kind === 'user') {
      await this.database.user.update({ where: { id }, data: { status: UserAccountStatus.ACTIVE } })
      return
    }
    if (kind === 'participant') {
      await this.database.chronicleParticipant.update({ where: { id }, data: { status: ChronicleParticipantStatus.ACTIVE } })
      return
    }
    if (kind === 'chronicle') {
      await this.database.chronicle.update({ where: { id }, data: { status: ChronicleStatus.PREPARATION } })
      return
    }
    if (kind === 'character') {
      await this.database.character.update({ where: { id }, data: { status: CharacterStatus.DRAFT } })
      return
    }
    if (kind === 'story') {
      await this.database.chronicleStory.update({ where: { id }, data: { status: ChronicleStoryStatus.PLANNED, archivedAt: null } })
      return
    }
    if (kind === 'session') {
      await this.database.chronicleSession.update({ where: { id }, data: { status: ChronicleSessionStatus.PREPARATION } })
      return
    }
    if (kind === 'event') {
      await this.database.chronicleEvent.update({ where: { id }, data: { status: ChronicleEventStatus.ACTIVE } })
      return
    }
    if (kind === 'npc') {
      await this.database.chronicleNpc.update({ where: { id }, data: { status: ChronicleNpcStatus.ACTIVE } })
      return
    }
    if (kind === 'location') {
      await this.database.chronicleLocation.update({ where: { id }, data: { status: ChronicleLocationStatus.ACTIVE } })
      return
    }
    await this.database.chronicleResource.update({ where: { id }, data: { status: 'active' } })
  }

  async purge(
    actorId: string,
    kind: LifecycleTrashKind,
    id: string,
    confirmation: string,
  ): Promise<void> {
    const dependencies = await this.dependencies(actorId, kind, id)
    if (confirmation !== dependencies.label) throw new LifecycleTrashConfirmationError()
    if (!dependencies.canPurge) throw new LifecycleTrashConflictError(dependencies.blockers)

    await this.database.$transaction(async (transaction) => {
      if (kind === 'user') {
        await transaction.authSession.deleteMany({ where: { userId: id } })
        await transaction.user.delete({ where: { id } })
        return
      }
      if (kind === 'character') {
        await transaction.chronicleStoryCharacter.deleteMany({ where: { characterId: id } })
        await transaction.chronicleEventCharacter.deleteMany({ where: { characterId: id } })
        await transaction.character.delete({ where: { id } })
        return
      }
      if (kind === 'story') {
        await transaction.chronicleStorySession.deleteMany({ where: { storyId: id } })
        await transaction.chronicleStoryEvent.deleteMany({ where: { storyId: id } })
        await transaction.chronicleStoryCharacter.deleteMany({ where: { storyId: id } })
        await transaction.chronicleStoryNpc.deleteMany({ where: { storyId: id } })
        await transaction.chronicleStoryLocation.deleteMany({ where: { storyId: id } })
        await transaction.chronicleStoryMilestone.deleteMany({ where: { storyId: id } })
        await transaction.chronicleStoryReminder.deleteMany({ where: { storyId: id } })
        await transaction.chronicleStory.delete({ where: { id } })
        return
      }
      if (kind === 'session') {
        await transaction.chronicleStorySession.deleteMany({ where: { sessionId: id } })
        await transaction.chronicleSessionAttendance.deleteMany({ where: { sessionId: id } })
        await transaction.chronicleSessionEvent.deleteMany({ where: { sessionId: id } })
        await transaction.chronicleSessionNpc.deleteMany({ where: { sessionId: id } })
        await transaction.chronicleSessionLocation.deleteMany({ where: { sessionId: id } })
        await transaction.chronicleSessionScene.deleteMany({ where: { sessionId: id } })
        await transaction.chronicleSessionPreparationItem.deleteMany({ where: { sessionId: id } })
        await transaction.chronicleSession.delete({ where: { id } })
        return
      }
      if (kind === 'event') {
        await transaction.chronicleStoryEvent.deleteMany({ where: { eventId: id } })
        await transaction.chronicleSessionEvent.deleteMany({ where: { eventId: id } })
        await transaction.chronicleEventCharacter.deleteMany({ where: { eventId: id } })
        await transaction.chronicleEventNpc.deleteMany({ where: { eventId: id } })
        await transaction.chronicleEventLocation.deleteMany({ where: { eventId: id } })
        await transaction.chronicleEvent.delete({ where: { id } })
        return
      }
      if (kind === 'npc') {
        await transaction.chronicleStoryNpc.deleteMany({ where: { npcId: id } })
        await transaction.chronicleSessionNpc.deleteMany({ where: { npcId: id } })
        await transaction.chronicleEventNpc.deleteMany({ where: { npcId: id } })
        await transaction.chronicleNpc.delete({ where: { id } })
        return
      }
      if (kind === 'location') {
        await transaction.chronicleStoryLocation.deleteMany({ where: { locationId: id } })
        await transaction.chronicleSessionLocation.deleteMany({ where: { locationId: id } })
        await transaction.chronicleEventLocation.deleteMany({ where: { locationId: id } })
        await transaction.chronicleLocation.delete({ where: { id } })
        return
      }
      if (kind === 'resource') {
        await transaction.chronicleResource.delete({ where: { id } })
        return
      }
      if (kind === 'chronicle') {
        await transaction.chronicleStorySession.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleStoryEvent.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleStoryCharacter.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleStoryNpc.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleStoryLocation.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleSessionAttendance.deleteMany({ where: { session: { chronicleId: id } } })
        await transaction.chronicleSessionEvent.deleteMany({ where: { session: { chronicleId: id } } })
        await transaction.chronicleSessionNpc.deleteMany({ where: { session: { chronicleId: id } } })
        await transaction.chronicleSessionLocation.deleteMany({ where: { session: { chronicleId: id } } })
        await transaction.chronicleEventCharacter.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleEventNpc.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleEventLocation.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleStoryMilestone.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleStoryReminder.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleSessionScene.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleSessionPreparationItem.deleteMany({ where: { chronicleId: id } })
        await transaction.character.updateMany({ where: { chronicleId: id }, data: { chronicleId: null } })
        await transaction.chronicleParticipant.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleResource.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleStory.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleSession.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleEvent.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleNpc.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicleLocation.deleteMany({ where: { chronicleId: id } })
        await transaction.chronicle.delete({ where: { id } })
      }
    })
  }
}
