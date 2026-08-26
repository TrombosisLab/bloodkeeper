import type {
  OffsetPage,
} from '../../common/offset-pagination'

import type {
  ChronicleStoryListQuery,
  ChronicleStorySnapshot,
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
} from '../domain/chronicle-story.types'

export const CHRONICLE_STORY_REPOSITORY =
  Symbol('CHRONICLE_STORY_REPOSITORY')

export class ChronicleStoryWriteConflictError
  extends Error {
  constructor(storyId: string) {
    super(
      `Chronicle story write conflict: ${storyId}`,
    )
    this.name =
      'ChronicleStoryWriteConflictError'
  }
}

export class ChronicleStoryReminderNotFoundError
  extends Error {
  constructor(reminderId: string) {
    super(
      `Chronicle story reminder not found: ${reminderId}`,
    )
    this.name =
      'ChronicleStoryReminderNotFoundError'
  }
}

export class ChronicleStoryContextReferenceError
  extends Error {
  constructor(
    readonly kind: string,
    readonly referenceId: string,
  ) {
    super(`Chronicle story ${kind} reference not found: ${referenceId}`)
    this.name = 'ChronicleStoryContextReferenceError'
  }
}

export class ChronicleStorySessionLinkNotFoundError
  extends Error {
  constructor(sessionId: string) {
    super(`Chronicle story session link not found: ${sessionId}`)
    this.name = 'ChronicleStorySessionLinkNotFoundError'
  }
}

export type ChronicleStoryCompletionFailure =
  | 'chronicle_not_active'
  | 'story_not_active'
  | 'resolution_required'
  | 'eligible_session_required'
  | 'preparation_sessions_linked'
  | 'already_completed'

export class ChronicleStoryCompletionPreconditionError extends Error {
  constructor(readonly failure: ChronicleStoryCompletionFailure) {
    super(`Chronicle story cannot be completed: ${failure}`)
    this.name = 'ChronicleStoryCompletionPreconditionError'
  }
}

export class ChronicleStoryCompletionOperationConflictError extends Error {
  constructor(operationId: string) {
    super(`Chronicle story completion operation conflict: ${operationId}`)
    this.name = 'ChronicleStoryCompletionOperationConflictError'
  }
}

export interface ChronicleStoryRepository {
  listByChronicleId(
    chronicleId: string,
    query: ChronicleStoryListQuery,
  ): Promise<OffsetPage<ChronicleStorySnapshot>>

  listSharedByChronicleId(
    chronicleId: string,
    query: ChronicleStoryListQuery,
  ): Promise<OffsetPage<ChronicleStorySnapshot>>

  findById(
    chronicleId: string,
    storyId: string,
  ): Promise<ChronicleStorySnapshot | null>

  create(
    data: CreateChronicleStoryData,
  ): Promise<ChronicleStorySnapshot>

  update(
    data: UpdateChronicleStoryData,
  ): Promise<ChronicleStorySnapshot>

  transition(
    data: TransitionChronicleStoryData,
  ): Promise<ChronicleStorySnapshot>

  updateMilestone(
    data: UpdateChronicleStoryMilestoneData,
  ): Promise<ChronicleStorySnapshot>

  createReminder(
    data: CreateChronicleStoryReminderData,
  ): Promise<ChronicleStorySnapshot>

  updateReminder(
    data: UpdateChronicleStoryReminderData,
  ): Promise<ChronicleStorySnapshot>

  removeReminder(
    data: RemoveChronicleStoryReminderData,
  ): Promise<ChronicleStorySnapshot>

  replaceContext(
    data: ReplaceChronicleStoryContextData,
  ): Promise<ChronicleStorySnapshot>

  updateSessionProgress(
    data: UpdateChronicleStorySessionProgressData,
  ): Promise<ChronicleStorySnapshot>

  complete(
    data: CompleteChronicleStoryData,
  ): Promise<ChronicleStorySnapshot>
}
