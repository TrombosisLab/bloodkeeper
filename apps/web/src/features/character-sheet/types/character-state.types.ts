import type {
  CharacterHumanityState,
} from '../domain/humanity-state-rules'

export interface CharacterState {
  humanity: CharacterHumanityState
  hunger: number | null
  bloodPotency: number | null
}
