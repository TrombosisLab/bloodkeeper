import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import {
  CharacterBloodResonanceOperationConflictError,
  CharacterBloodResonanceWriteConflictError,
} from './character-draft.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  assertValidConsumedBloodProfile,
  deriveCharacterBloodResonanceHungerAfter,
  isSameCharacterBloodResonanceOperation,
} from '../domain/character-blood-resonance.types'

import type {
  CharacterBloodResonanceKey,
  CharacterBloodSourceKind,
  CharacterBloodSpecialAffinityKey,
  CharacterBloodTemperament,
} from '../domain/character-blood-resonance.types'

import {
  requireCharacterBlood,
} from '../domain/character-vampire-state.rules'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export interface ApplyCharacterBloodResonanceCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly operationId: string
  readonly sourceKind: CharacterBloodSourceKind
  readonly resonanceKey:
    CharacterBloodResonanceKey | null
  readonly specialAffinityKey:
    CharacterBloodSpecialAffinityKey | null
  readonly temperament:
    CharacterBloodTemperament | null
  readonly hungerSlaked: number
}

export class CharacterBloodResonanceNotFoundError
  extends Error {
  constructor(characterId: string) {
    super(`Character not found: ${characterId}`)
    this.name =
      'CharacterBloodResonanceNotFoundError'
  }
}

export class CharacterBloodResonancePermissionError
  extends Error {
  constructor() {
    super(
      'Character owner or active contextual Narrator permission is required',
    )
    this.name =
      'CharacterBloodResonancePermissionError'
  }
}

export class CharacterBloodResonanceArchivedError
  extends Error {
  constructor(characterId: string) {
    super(
      `Archived character cannot consume Resonance: ${characterId}`,
    )
    this.name =
      'CharacterBloodResonanceArchivedError'
  }
}

export class CharacterBloodResonanceNatureError
  extends Error {
  constructor(characterId: string) {
    super(
      `Human character cannot consume Resonance: ${characterId}`,
    )
    this.name =
      'CharacterBloodResonanceNatureError'
  }
}

export class ApplyCharacterBloodResonanceUseCase {
  constructor(
    private readonly characters:
      CharacterDraftRepository,
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  private async assertPermission(
    actorUserId: string,
    character: Pick<
      PersistedCharacterDraft,
      'ownerId' | 'chronicleId'
    >,
  ): Promise<void> {
    if (character.chronicleId === null) {
      if (character.ownerId !== actorUserId) {
        throw new CharacterBloodResonancePermissionError()
      }

      return
    }

    const membership =
      await this.participants.findActiveMembership(
        character.chronicleId,
        actorUserId,
      )

    if (
      membership === null ||
      membership.role !== 'narrator'
    ) {
      throw new CharacterBloodResonancePermissionError()
    }
  }

  async execute(
    actorUserId: string,
    command: ApplyCharacterBloodResonanceCommand,
  ): Promise<PersistedCharacterDraft> {
    const current =
      await this.characters.findByCharacterId(
        command.characterId,
      )

    if (current === null) {
      throw new CharacterBloodResonanceNotFoundError(
        command.characterId,
      )
    }

    await this.assertPermission(
      actorUserId,
      current,
    )

    const existing =
      await this.characters
        .findBloodResonanceOperation(
          command.characterId,
          command.operationId,
        )

    if (existing !== null) {
      if (
        !isSameCharacterBloodResonanceOperation(
          existing,
          command,
        )
      ) {
        throw new CharacterBloodResonanceOperationConflictError(
          command.characterId,
          command.operationId,
        )
      }

      return current
    }

    if (current.status === 'archived') {
      throw new CharacterBloodResonanceArchivedError(
        command.characterId,
      )
    }

    if (current.nature !== 'vampire') {
      throw new CharacterBloodResonanceNatureError(
        command.characterId,
      )
    }

    if (
      current.revision !==
      command.expectedRevision
    ) {
      throw new CharacterBloodResonanceWriteConflictError(
        command.characterId,
      )
    }

    const blood =
      requireCharacterBlood(current)

    assertValidConsumedBloodProfile(command)

    const hungerAfter =
      deriveCharacterBloodResonanceHungerAfter(
        blood.hunger,
        command.hungerSlaked,
      )

    return this.characters
      .applyBloodResonance({
        characterId: command.characterId,
        expectedRevision:
          command.expectedRevision,
        operationId: command.operationId,
        sourceKind: command.sourceKind,
        resonanceKey: command.resonanceKey,
        specialAffinityKey:
          command.specialAffinityKey,
        temperament: command.temperament,
        hungerSlaked: command.hungerSlaked,
        hungerBefore: blood.hunger,
        hungerAfter,
      })
  }
}
