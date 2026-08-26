import {
  Inject,
  Injectable,
} from '@nestjs/common'

import type {
  OffsetPage,
} from '../../common/offset-pagination'

import {
  canTransitionChronicleStory,
  normalizeChronicleStoryTitle,
} from '../domain/chronicle-story.rules'
import type {
  ChronicleStoryListQuery,
  ChronicleStoryMilestoneKey,
  ChronicleStorySnapshot,
  ChronicleStoryType,
  ChronicleStoryVisibility,
} from '../domain/chronicle-story.types'
import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
} from './chronicle-participant.repository'
import type {
  ChronicleParticipantRepository,
} from './chronicle-participant.repository'
import {
  assertChronicleStoryNarrator,
  assertChronicleStoryParticipant,
} from './chronicle-story-permission'
import {
  CHRONICLE_STORY_REPOSITORY,
} from './chronicle-story.repository'
import type {
  ChronicleStoryRepository,
} from './chronicle-story.repository'

export class ChronicleStoryNotFoundError
  extends Error {
  constructor(storyId: string) {
    super(
      `Chronicle story not found: ${storyId}`,
    )
    this.name =
      'ChronicleStoryNotFoundError'
  }
}

export class ChronicleStoryTransitionError
  extends Error {
  constructor(
    from: string,
    to: string,
  ) {
    super(
      `Invalid Chronicle story transition: ${from} -> ${to}`,
    )
    this.name =
      'ChronicleStoryTransitionError'
  }
}

export class ChronicleStoryImmutableError
  extends Error {
  constructor(storyId: string) {
    super(
      `Chronicle story is read-only: ${storyId}`,
    )
    this.name =
      'ChronicleStoryImmutableError'
  }
}

export class ChronicleStoryCompletionConfirmationError extends Error {
  constructor() {
    super('Chronicle story completion must be explicitly confirmed')
    this.name = 'ChronicleStoryCompletionConfirmationError'
  }
}

@Injectable()
abstract class ChronicleStoryUseCaseBase {
  constructor(
    @Inject(CHRONICLE_STORY_REPOSITORY)
    protected readonly stories:
      ChronicleStoryRepository,
    @Inject(CHRONICLE_PARTICIPANT_REPOSITORY)
    protected readonly participants:
      ChronicleParticipantRepository,
  ) {}

  protected async assertNarrator(
    actorUserId: string,
    chronicleId: string,
  ): Promise<void> {
    await assertChronicleStoryNarrator(
      this.participants,
      actorUserId,
      chronicleId,
    )
  }

  protected async loadMutable(
    chronicleId: string,
    storyId: string,
  ): Promise<ChronicleStorySnapshot> {
    const story =
      await this.stories.findById(
        chronicleId,
        storyId,
      )

    if (story === null) {
      throw new ChronicleStoryNotFoundError(
        storyId,
      )
    }

    if (
      story.status === 'completed' ||
      story.status === 'archived'
    ) {
      throw new ChronicleStoryImmutableError(
        storyId,
      )
    }

    return story
  }
}

@Injectable()
export class ListChronicleStoriesUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    chronicleId: string,
    query: ChronicleStoryListQuery,
  ): Promise<OffsetPage<ChronicleStorySnapshot>> {
    await this.assertNarrator(
      actorUserId,
      chronicleId,
    )

    return this.stories.listByChronicleId(
      chronicleId,
      query,
    )
  }
}

@Injectable()
export class ListSharedChronicleStoriesUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    chronicleId: string,
    query: ChronicleStoryListQuery,
  ): Promise<OffsetPage<ChronicleStorySnapshot>> {
    await assertChronicleStoryParticipant(
      this.participants,
      actorUserId,
      chronicleId,
    )

    return this.stories.listSharedByChronicleId(
      chronicleId,
      query,
    )
  }
}

@Injectable()
export class LoadChronicleStoryUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    chronicleId: string,
    storyId: string,
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(
      actorUserId,
      chronicleId,
    )

    const story =
      await this.stories.findById(
        chronicleId,
        storyId,
      )

    if (story === null) {
      throw new ChronicleStoryNotFoundError(
        storyId,
      )
    }

    return story
  }
}

export interface CreateChronicleStoryCommand {
  readonly chronicleId: string
  readonly title: string
  readonly type: ChronicleStoryType
  readonly premise: string | null
  readonly stakes: string | null
  readonly narratorNotes: string | null
  readonly sharedSummary: string | null
  readonly visibility: ChronicleStoryVisibility
}

@Injectable()
export class CreateChronicleStoryUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    command: CreateChronicleStoryCommand,
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(
      actorUserId,
      command.chronicleId,
    )

    return this.stories.create({
      ...command,
      createdById: actorUserId,
      title:
        normalizeChronicleStoryTitle(
          command.title,
        ),
    })
  }
}

export interface UpdateChronicleStoryCommand {
  readonly chronicleId: string
  readonly storyId: string
  readonly expectedRevision: number
  readonly title?: string
  readonly type?: ChronicleStoryType
  readonly premise?: string | null
  readonly stakes?: string | null
  readonly narratorNotes?: string | null
  readonly sharedSummary?: string | null
  readonly visibility?: ChronicleStoryVisibility
}

@Injectable()
export class UpdateChronicleStoryUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    command: UpdateChronicleStoryCommand,
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(
      actorUserId,
      command.chronicleId,
    )
    await this.loadMutable(
      command.chronicleId,
      command.storyId,
    )

    return this.stories.update({
      ...command,
      ...(command.title === undefined
        ? {}
        : {
            title:
              normalizeChronicleStoryTitle(
                command.title,
              ),
          }),
    })
  }
}

@Injectable()
export class ActivateChronicleStoryUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    chronicleId: string,
    storyId: string,
    expectedRevision: number,
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(
      actorUserId,
      chronicleId,
    )
    const story =
      await this.loadMutable(
        chronicleId,
        storyId,
      )

    if (
      !canTransitionChronicleStory(
        story.status,
        'active',
      )
    ) {
      throw new ChronicleStoryTransitionError(
        story.status,
        'active',
      )
    }

    return this.stories.transition({
      chronicleId,
      storyId,
      expectedRevision,
      to: 'active',
    })
  }
}

@Injectable()
export class ArchiveChronicleStoryUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    chronicleId: string,
    storyId: string,
    expectedRevision: number,
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(
      actorUserId,
      chronicleId,
    )
    const story =
      await this.stories.findById(
        chronicleId,
        storyId,
      )

    if (story === null) {
      throw new ChronicleStoryNotFoundError(
        storyId,
      )
    }

    if (story.status === 'archived') {
      return story
    }

    if (
      !canTransitionChronicleStory(
        story.status,
        'archived',
      )
    ) {
      throw new ChronicleStoryTransitionError(
        story.status,
        'archived',
      )
    }

    return this.stories.transition({
      chronicleId,
      storyId,
      expectedRevision,
      to: 'archived',
    })
  }
}

@Injectable()
export class UpdateChronicleStoryMilestoneUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    command: {
      readonly chronicleId: string
      readonly storyId: string
      readonly key: ChronicleStoryMilestoneKey
      readonly expectedRevision: number
      readonly completed: boolean
      readonly note?: string | null
    },
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(
      actorUserId,
      command.chronicleId,
    )
    await this.loadMutable(
      command.chronicleId,
      command.storyId,
    )

    return this.stories.updateMilestone({
      ...command,
      actorUserId,
    })
  }
}

@Injectable()
export class CreateChronicleStoryReminderUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    command: {
      readonly chronicleId: string
      readonly storyId: string
      readonly expectedRevision: number
      readonly text: string
    },
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(
      actorUserId,
      command.chronicleId,
    )
    await this.loadMutable(
      command.chronicleId,
      command.storyId,
    )

    return this.stories.createReminder({
      ...command,
      text: normalizeReminderText(
        command.text,
      ),
    })
  }
}

@Injectable()
export class UpdateChronicleStoryReminderUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    command: {
      readonly chronicleId: string
      readonly storyId: string
      readonly reminderId: string
      readonly expectedRevision: number
      readonly text?: string
      readonly resolved?: boolean
    },
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(
      actorUserId,
      command.chronicleId,
    )
    await this.loadMutable(
      command.chronicleId,
      command.storyId,
    )

    return this.stories.updateReminder({
      ...command,
      ...(command.text === undefined
        ? {}
        : {
            text: normalizeReminderText(
              command.text,
            ),
          }),
    })
  }
}

@Injectable()
export class RemoveChronicleStoryReminderUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    command: {
      readonly chronicleId: string
      readonly storyId: string
      readonly reminderId: string
      readonly expectedRevision: number
    },
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(
      actorUserId,
      command.chronicleId,
    )
    await this.loadMutable(
      command.chronicleId,
      command.storyId,
    )

    return this.stories.removeReminder(
      command,
    )
  }
}

export interface ReplaceChronicleStoryContextCommand {
  readonly chronicleId: string
  readonly storyId: string
  readonly expectedRevision: number
  readonly sessionIds: readonly string[]
  readonly eventIds: readonly string[]
  readonly characterIds: readonly string[]
  readonly npcIds: readonly string[]
  readonly locationIds: readonly string[]
}

@Injectable()
export class ReplaceChronicleStoryContextUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    command: ReplaceChronicleStoryContextCommand,
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(actorUserId, command.chronicleId)
    await this.loadMutable(command.chronicleId, command.storyId)
    return this.stories.replaceContext(command)
  }
}

@Injectable()
export class UpdateChronicleStorySessionProgressUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    command: {
      readonly chronicleId: string
      readonly storyId: string
      readonly sessionId: string
      readonly expectedRevision: number
      readonly progressNotes: string | null
    },
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(actorUserId, command.chronicleId)
    await this.loadMutable(command.chronicleId, command.storyId)
    return this.stories.updateSessionProgress(command)
  }
}

@Injectable()
export class CompleteChronicleStoryUseCase
  extends ChronicleStoryUseCaseBase {
  async execute(
    actorUserId: string,
    command: {
      readonly chronicleId: string
      readonly storyId: string
      readonly expectedRevision: number
      readonly operationId: string
      readonly resolution: string
      readonly confirmed: true
    },
  ): Promise<ChronicleStorySnapshot> {
    await this.assertNarrator(actorUserId, command.chronicleId)
    const resolution = command.resolution.trim()
    if (resolution.length === 0 || resolution.length > 8000) {
      throw new Error('Chronicle story resolution must contain between 1 and 8000 characters')
    }
    return this.stories.complete({
      chronicleId: command.chronicleId,
      storyId: command.storyId,
      actorUserId,
      expectedRevision: command.expectedRevision,
      operationId: command.operationId,
      resolution,
    })
  }
}

function normalizeReminderText(
  value: string,
): string {
  const text = value.trim()
  if (
    text.length === 0 ||
    text.length > 500
  ) {
    throw new Error(
      'Chronicle story reminder must contain between 1 and 500 characters',
    )
  }
  return text
}
