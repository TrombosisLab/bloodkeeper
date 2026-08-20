import type {
  PersistedCharacterDamageState,
} from './persisted-character.types'

export interface UpdateCharacterStateData {
  readonly characterId: string
  readonly expectedRevision: number
  readonly damage?: PersistedCharacterDamageState
  readonly humanityValue?: number
  readonly humanityStains?: number
  readonly hunger?: number
  readonly clearBloodResonance?: boolean
}
