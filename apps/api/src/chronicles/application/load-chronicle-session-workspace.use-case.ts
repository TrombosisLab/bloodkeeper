import { Inject, Injectable } from '@nestjs/common'
import { ChronicleSessionWorkStatus } from '@prisma/client'
import { DatabaseService } from '../../database/database.service'
import { CHRONICLE_PARTICIPANT_REPOSITORY } from './chronicle-participant.repository'
import { assertChronicleSessionNarrator } from './chronicle-session-permission'
import type { ChronicleParticipantRepository } from './chronicle-participant.repository'

export interface ChronicleSessionWorkspaceItem {
  readonly id: string
  readonly sortOrder: number
  readonly status: 'pending' | 'completed'
  readonly revision: number
}
export interface ChronicleSessionWorkspaceScene extends ChronicleSessionWorkspaceItem {
  readonly title: string
  readonly purpose: string | null
  readonly narrativePhase: string | null
  readonly intensity: number | null
}
export interface ChronicleSessionWorkspacePreparationItem extends ChronicleSessionWorkspaceItem {
  readonly text: string
}
export interface ChronicleSessionWorkspace {
  readonly sessionId: string
  readonly scenes: readonly ChronicleSessionWorkspaceScene[]
  readonly preparationItems: readonly ChronicleSessionWorkspacePreparationItem[]
  readonly progress: { readonly completed: number; readonly total: number; readonly percentage: number }
}
function status(value: ChronicleSessionWorkStatus): 'pending' | 'completed' {
  return value === ChronicleSessionWorkStatus.COMPLETED ? 'completed' : 'pending'
}
@Injectable()
export class LoadChronicleSessionWorkspaceUseCase {
  constructor(
    private readonly database: DatabaseService,
    @Inject(CHRONICLE_PARTICIPANT_REPOSITORY) private readonly participants: ChronicleParticipantRepository,
  ) {}
  async execute(actorUserId: string, chronicleId: string, sessionId: string): Promise<ChronicleSessionWorkspace | null> {
    await assertChronicleSessionNarrator(this.participants, actorUserId, chronicleId)
    const session = await this.database.chronicleSession.findFirst({ where: { id: sessionId, chronicleId }, select: { id: true } })
    if (session === null) return null
    const [scenes, preparationItems] = await Promise.all([
      this.database.chronicleSessionScene.findMany({ where: { chronicleId, sessionId }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
      this.database.chronicleSessionPreparationItem.findMany({ where: { chronicleId, sessionId }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
    ])
    const completed = preparationItems.filter((item) => item.status === ChronicleSessionWorkStatus.COMPLETED).length
    const total = preparationItems.length
    return {
      sessionId: session.id,
      scenes: scenes.map((scene) => ({ id: scene.id, title: scene.title, purpose: scene.purpose, narrativePhase: scene.narrativePhase, intensity: scene.intensity, sortOrder: scene.sortOrder, status: status(scene.status), revision: scene.revision })),
      preparationItems: preparationItems.map((item) => ({ id: item.id, text: item.text, sortOrder: item.sortOrder, status: status(item.status), revision: item.revision })),
      progress: { completed, total, percentage: total === 0 ? 0 : Math.round((completed / total) * 100) },
    }
  }
}
