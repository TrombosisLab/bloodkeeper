import type {
  PurchaseCharacterAdvancementData,
} from '../domain/character-advancement.types'
import type {
  AppendCharacterExperienceCorrectionData,
  AppendCharacterExperienceGrantData,
  CharacterExperienceCharacter,
  CharacterExperienceLedger,
  CharacterExperienceMovement,
  CharacterExperienceSession,
} from '../domain/character-experience.types'

export const CHARACTER_EXPERIENCE_REPOSITORY =
  Symbol('CHARACTER_EXPERIENCE_REPOSITORY')

export class CharacterExperienceDuplicateError
  extends Error {
  constructor(characterId: string) {
    super(
      `Duplicate experience movement for character ${characterId}`,
    )
    this.name =
      'CharacterExperienceDuplicateError'
  }
}

export class CharacterExperienceWriteConflictError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character experience context changed: ${characterId}`,
    )
    this.name =
      'CharacterExperienceWriteConflictError'
  }
}

export class CharacterAdvancementRevisionConflictError extends Error {
  constructor(characterId: string) {
    super(`Character advancement revision conflict: ${characterId}`)
    this.name = 'CharacterAdvancementRevisionConflictError'
  }
}

export class CharacterAdvancementArchivedError extends Error {
  constructor() {
    super('Archived characters cannot evolve')
    this.name = 'CharacterAdvancementArchivedError'
  }
}

export class CharacterExperienceInsufficientError extends Error {
  constructor() {
    super('Available experience is insufficient')
    this.name = 'CharacterExperienceInsufficientError'
  }
}

export class CharacterExperienceSessionInvalidError
  extends Error {
  constructor() {
    super(
      'The linked session is not a completed session of the character chronicle',
    )
    this.name =
      'CharacterExperienceSessionInvalidError'
  }
}

export class CharacterExperienceMovementNotFoundError
  extends Error {
  constructor(movementId: string) {
    super(
      `Experience movement not found: ${movementId}`,
    )
    this.name =
      'CharacterExperienceMovementNotFoundError'
  }
}

export interface CharacterExperienceRepository {
  findCharacter(
    characterId: string,
  ): Promise<CharacterExperienceCharacter | null>

  findSession(
    sessionId: string,
  ): Promise<CharacterExperienceSession | null>

  findMovement(
    characterId: string,
    movementId: string,
  ): Promise<CharacterExperienceMovement | null>

  loadLedger(
    characterId: string,
  ): Promise<CharacterExperienceLedger>

  appendGrant(
    data: AppendCharacterExperienceGrantData,
  ): Promise<CharacterExperienceLedger>

  appendCorrection(
    data: AppendCharacterExperienceCorrectionData,
  ): Promise<CharacterExperienceLedger>

  purchase(
    data: PurchaseCharacterAdvancementData,
  ): Promise<CharacterExperienceLedger>
}
