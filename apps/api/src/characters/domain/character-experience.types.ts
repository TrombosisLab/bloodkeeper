export type CharacterExperienceMovementType =
  | 'grant'
  | 'spend'
  | 'correction'

export type CharacterExperienceComponent =
  | 'earned'
  | 'spent'

export type CharacterExperienceGrantReason =
  | 'session_played'
  | 'story_end'
  | 'fast_session'

export type CharacterExperienceSessionStatus =
  | 'preparation'
  | 'completed'
  | 'archived'

export interface CharacterExperienceMovement {
  readonly id: string
  readonly characterId: string
  readonly actorId: string
  readonly sessionId: string | null
  readonly type: CharacterExperienceMovementType
  readonly component: CharacterExperienceComponent
  readonly amount: number
  readonly reason: string
  readonly acquisitionType: string | null
  readonly acquisitionKey: string | null
  readonly correctsMovementId: string | null
  readonly createdAt: Date
}

export interface CharacterExperienceLedger {
  readonly characterId: string
  readonly total: number
  readonly spent: number
  readonly available: number
  readonly movements:
    readonly CharacterExperienceMovement[]
}

export interface CharacterExperienceLedgerPage {
  readonly characterId: string
  readonly total: number
  readonly spent: number
  readonly available: number
  readonly movements:
    readonly CharacterExperienceMovement[]
  readonly nextOffset: number | null
}

export interface CharacterExperienceCharacter {
  readonly id: string
  readonly ownerId: string
  readonly chronicleId: string | null
  readonly status:
    | 'draft'
    | 'active'
    | 'archived'
}

export interface CharacterExperienceSession {
  readonly id: string
  readonly chronicleId: string
  readonly status:
    CharacterExperienceSessionStatus
}

export interface GrantCharacterExperienceCommand {
  readonly characterId: string
  readonly reason:
    CharacterExperienceGrantReason
  readonly sessionId: string | null
  readonly operationId: string
}

export interface CorrectCharacterExperienceCommand {
  readonly characterId: string
  readonly targetMovementId: string
  readonly amount: number
  readonly reason: string
  readonly operationId: string
}

export interface AppendCharacterExperienceGrantData {
  readonly characterId: string
  readonly actorId: string
  readonly chronicleId: string
  readonly sessionId: string | null
  readonly amount: number
  readonly reason:
    CharacterExperienceGrantReason
  readonly deduplicationKey: string
}

export interface AppendCharacterExperienceCorrectionData {
  readonly characterId: string
  readonly actorId: string
  readonly chronicleId: string
  readonly targetMovementId: string
  readonly amount: number
  readonly reason: string
  readonly deduplicationKey: string
}
