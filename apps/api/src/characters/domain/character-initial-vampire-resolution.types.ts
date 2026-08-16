import type {
  PersistedCharacterBlood,
  PersistedCharacterDraft,
} from './persisted-character.types'

import type {
  CharacterEmbracePendingDecision,
} from './character-embrace.types'

export type InitialVampireResolutionKind =
  | 'clan'
  | 'generation'
  | 'bloodState'

export type PersistInitialVampireResolutionData =
  | {
      readonly kind: 'clan'
      readonly characterId: string
      readonly expectedRevision: number
      readonly clanKey: string
    }
  | {
      readonly kind: 'generation'
      readonly characterId: string
      readonly expectedRevision: number
      readonly generation: number
    }
  | {
      readonly kind: 'bloodState'
      readonly characterId: string
      readonly expectedRevision: number
      readonly blood: PersistedCharacterBlood
    }

export interface InitialVampireResolutionResult {
  readonly character: PersistedCharacterDraft
  readonly pendingDecisions:
    readonly CharacterEmbracePendingDecision[]
}
