import type {
  CharacterDamageTrack,
  DamageState,
} from '../domain/damage-track-rules'

export type {
  DamageState,
} from '../domain/damage-track-rules'

export interface DamageTrackerData {
  label: string
  capacity: number
  track: CharacterDamageTrack
}
