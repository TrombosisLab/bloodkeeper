import type {
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'
import {
  characterExperienceGrantKey,
  characterExperienceGrantPolicy,
  projectCharacterExperienceCorrection,
} from '../domain/character-experience.rules'
import type {
  CharacterExperienceLedger,
  CharacterExperienceLedgerPage,
  CorrectCharacterExperienceCommand,
  GrantCharacterExperienceCommand,
} from '../domain/character-experience.types'
import {
  CharacterExperienceMovementNotFoundError,
} from './character-experience.repository'
import {
  assertCharacterExperienceNarrator,
  assertCharacterExperienceReader,
} from './character-experience-permission'
import type {
  CharacterExperienceRepository,
} from './character-experience.repository'

export class CharacterExperienceCharacterNotFoundError
  extends Error {
  constructor(characterId: string) {
    super(`Character not found: ${characterId}`)
    this.name =
      'CharacterExperienceCharacterNotFoundError'
  }
}

export class CharacterExperienceChronicleRequiredError
  extends Error {
  constructor() {
    super(
      'Experience grants require an explicit character chronicle',
    )
    this.name =
      'CharacterExperienceChronicleRequiredError'
  }
}

export class CharacterExperienceSessionRequiredError
  extends Error {
  constructor() {
    super(
      'This experience grant reason requires a session',
    )
    this.name =
      'CharacterExperienceSessionRequiredError'
  }
}

export class CharacterExperienceSessionRuleError
  extends Error {
  constructor() {
    super(
      'Experience session must belong to the chronicle and be completed or archived',
    )
    this.name =
      'CharacterExperienceSessionRuleError'
  }
}

export class LoadCharacterExperienceUseCase {
  constructor(
    private readonly experience:
      CharacterExperienceRepository,
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    actorUserId: string,
    characterId: string,
    query: OffsetPaginationQuery,
  ): Promise<CharacterExperienceLedgerPage> {
    const character =
      await this.experience.findCharacter(
        characterId,
      )

    if (character === null) {
      throw new CharacterExperienceCharacterNotFoundError(
        characterId,
      )
    }

    await assertCharacterExperienceReader(
      this.participants,
      actorUserId,
      character,
    )

    return this.experience.loadLedgerPage(
      characterId,
      query,
    )
  }
}

export class GrantCharacterExperienceUseCase {
  constructor(
    private readonly experience:
      CharacterExperienceRepository,
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    actorUserId: string,
    command: GrantCharacterExperienceCommand,
  ): Promise<CharacterExperienceLedger> {
    const character =
      await this.experience.findCharacter(
        command.characterId,
      )

    if (character === null) {
      throw new CharacterExperienceCharacterNotFoundError(
        command.characterId,
      )
    }

    if (character.chronicleId === null) {
      throw new CharacterExperienceChronicleRequiredError()
    }

    await assertCharacterExperienceNarrator(
      this.participants,
      actorUserId,
      character.chronicleId,
    )

    const policy =
      characterExperienceGrantPolicy(
        command.reason,
      )

    if (
      policy.sessionRequired &&
      command.sessionId === null
    ) {
      throw new CharacterExperienceSessionRequiredError()
    }

    if (command.sessionId !== null) {
      const session =
        await this.experience.findSession(
          command.sessionId,
        )

      if (
        session === null ||
        session.chronicleId !==
          character.chronicleId ||
        session.status === 'preparation'
      ) {
        throw new CharacterExperienceSessionRuleError()
      }
    }

    return this.experience.appendGrant({
      characterId: command.characterId,
      actorId: actorUserId,
      chronicleId: character.chronicleId,
      sessionId: command.sessionId,
      amount: policy.amount,
      reason: command.reason,
      deduplicationKey:
        characterExperienceGrantKey(
          command.reason,
          command.sessionId,
          command.operationId,
        ),
    })
  }
}

export class CorrectCharacterExperienceUseCase {
  constructor(
    private readonly experience:
      CharacterExperienceRepository,
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    actorUserId: string,
    command: CorrectCharacterExperienceCommand,
  ): Promise<CharacterExperienceLedger> {
    const character =
      await this.experience.findCharacter(
        command.characterId,
      )

    if (character === null) {
      throw new CharacterExperienceCharacterNotFoundError(
        command.characterId,
      )
    }

    if (character.chronicleId === null) {
      throw new CharacterExperienceChronicleRequiredError()
    }

    await assertCharacterExperienceNarrator(
      this.participants,
      actorUserId,
      character.chronicleId,
    )

    const target =
      await this.experience.findMovement(
        command.characterId,
        command.targetMovementId,
      )

    if (target === null) {
      throw new CharacterExperienceMovementNotFoundError(
        command.targetMovementId,
      )
    }

    const ledger =
      await this.experience.loadLedger(
        command.characterId,
      )

    projectCharacterExperienceCorrection(
      ledger,
      target.component,
      command.amount,
    )

    return this.experience.appendCorrection({
      characterId: command.characterId,
      actorId: actorUserId,
      chronicleId: character.chronicleId,
      targetMovementId:
        command.targetMovementId,
      amount: command.amount,
      reason: command.reason,
      deduplicationKey:
        `correction:operation:${command.operationId}`,
    })
  }
}
