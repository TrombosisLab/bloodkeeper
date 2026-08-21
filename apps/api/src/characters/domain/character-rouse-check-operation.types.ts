import type {
  CharacterRouseCheckConsequence,
  CharacterRouseCheckReason,
} from './character-rouse-check.rules'

export interface CharacterRouseCheckOperationAttempt {
  readonly actorId: string
  readonly reason: CharacterRouseCheckReason
  readonly forced?: boolean
  readonly disciplinePowerLevel?: number | null
}

export interface PersistedCharacterRouseCheckOperation {
  readonly characterId: string
  readonly operationId: string
  readonly actorId: string
  readonly reason: CharacterRouseCheckReason
  readonly forced: boolean
  readonly bloodPotency: number | null
  readonly disciplinePowerLevel: number | null
  readonly rolls: readonly number[]
  readonly selectedResult: number
  readonly success: boolean
  readonly hungerBefore: number
  readonly hungerAfter: number
  readonly consequence:
    CharacterRouseCheckConsequence
  readonly consequenceDifficulty:
    number | null
  readonly rollHistoryId: string
  readonly characterRevision: number
  readonly createdAt: Date
}

export interface PersistCharacterRouseCheckData
  extends CharacterRouseCheckOperationAttempt {
  readonly characterId: string
  readonly operationId: string
  readonly expectedRevision: number
  readonly bloodPotency: number | null
  readonly disciplinePowerLevel: number | null
  readonly rolls: readonly number[]
  readonly selectedResult: number
  readonly success: boolean
  readonly hungerBefore: number
  readonly hungerAfter: number
  readonly consequence:
    CharacterRouseCheckConsequence
  readonly consequenceDifficulty:
    number | null
}

export function isSameCharacterRouseCheckOperation(
  existing:
    PersistedCharacterRouseCheckOperation,
  attempted:
    CharacterRouseCheckOperationAttempt,
): boolean {
  return (
    existing.actorId === attempted.actorId &&
    existing.reason === attempted.reason &&
    existing.forced ===
      (attempted.forced ?? false) &&
    existing.disciplinePowerLevel ===
      (attempted.disciplinePowerLevel ?? null)
  )
}
