import { Inject, Injectable } from '@nestjs/common'
import { ChronicleSessionStatus, ChronicleSessionWorkStatus } from '@prisma/client'
import { DatabaseService } from '../../database/database.service'
import { CHRONICLE_PARTICIPANT_REPOSITORY } from './chronicle-participant.repository'
import { assertChronicleSessionNarrator } from './chronicle-session-permission'
import type { ChronicleParticipantRepository } from './chronicle-participant.repository'

export class ChronicleSessionWorkspaceNotEditableError extends Error {}
export class ChronicleSessionWorkspaceConflictError extends Error {}
export class ChronicleSessionWorkspaceItemNotFoundError extends Error {}
export interface SceneInput { readonly title: string; readonly purpose: string | null; readonly narrativePhase: string | null; readonly intensity: number | null; readonly completed: boolean }
export interface PreparationInput { readonly text: string; readonly completed: boolean }

@Injectable()
export class ManageChronicleSessionWorkspaceUseCase {
  constructor(private readonly database: DatabaseService, @Inject(CHRONICLE_PARTICIPANT_REPOSITORY) private readonly participants: ChronicleParticipantRepository) {}
  private async editable(actorUserId: string, chronicleId: string, sessionId: string) {
    await assertChronicleSessionNarrator(this.participants, actorUserId, chronicleId)
    const session = await this.database.chronicleSession.findFirst({ where: { id: sessionId, chronicleId }, select: { id: true, status: true } })
    if (session === null) throw new ChronicleSessionWorkspaceItemNotFoundError()
    if (session.status !== ChronicleSessionStatus.PREPARATION) throw new ChronicleSessionWorkspaceNotEditableError()
  }
  async createScene(actorUserId: string, chronicleId: string, sessionId: string, input: SceneInput) {
    await this.editable(actorUserId, chronicleId, sessionId)
    const last = await this.database.chronicleSessionScene.aggregate({ where: { sessionId }, _max: { sortOrder: true } })
    return this.database.chronicleSessionScene.create({ data: { chronicleId, sessionId, title: input.title, purpose: input.purpose, narrativePhase: input.narrativePhase, intensity: input.intensity, status: input.completed ? ChronicleSessionWorkStatus.COMPLETED : ChronicleSessionWorkStatus.PENDING, sortOrder: (last._max.sortOrder ?? -1) + 1 } })
  }
  async updateScene(actorUserId: string, chronicleId: string, sessionId: string, sceneId: string, expectedRevision: number, input: SceneInput) {
    await this.editable(actorUserId, chronicleId, sessionId)
    const updated = await this.database.chronicleSessionScene.updateMany({ where: { id: sceneId, chronicleId, sessionId, revision: expectedRevision }, data: { title: input.title, purpose: input.purpose, narrativePhase: input.narrativePhase, intensity: input.intensity, status: input.completed ? ChronicleSessionWorkStatus.COMPLETED : ChronicleSessionWorkStatus.PENDING, revision: { increment: 1 } } })
    if (updated.count !== 1) throw new ChronicleSessionWorkspaceConflictError()
    return this.database.chronicleSessionScene.findUniqueOrThrow({ where: { id: sceneId } })
  }
  async createPreparationItem(actorUserId: string, chronicleId: string, sessionId: string, input: PreparationInput) {
    await this.editable(actorUserId, chronicleId, sessionId)
    const last = await this.database.chronicleSessionPreparationItem.aggregate({ where: { sessionId }, _max: { sortOrder: true } })
    return this.database.chronicleSessionPreparationItem.create({ data: { chronicleId, sessionId, text: input.text, status: input.completed ? ChronicleSessionWorkStatus.COMPLETED : ChronicleSessionWorkStatus.PENDING, sortOrder: (last._max.sortOrder ?? -1) + 1 } })
  }
  async updatePreparationItem(actorUserId: string, chronicleId: string, sessionId: string, itemId: string, expectedRevision: number, input: PreparationInput) {
    await this.editable(actorUserId, chronicleId, sessionId)
    const updated = await this.database.chronicleSessionPreparationItem.updateMany({ where: { id: itemId, chronicleId, sessionId, revision: expectedRevision }, data: { text: input.text, status: input.completed ? ChronicleSessionWorkStatus.COMPLETED : ChronicleSessionWorkStatus.PENDING, revision: { increment: 1 } } })
    if (updated.count !== 1) throw new ChronicleSessionWorkspaceConflictError()
    return this.database.chronicleSessionPreparationItem.findUniqueOrThrow({ where: { id: itemId } })
  }
}
