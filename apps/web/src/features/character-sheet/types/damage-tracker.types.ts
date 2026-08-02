import type {
  DamageState,
} from '../domain/damage-track-rules'

export type {
  DamageState,
} from '../domain/damage-track-rules'

export interface DamageTrackerData {
  label: string
  capacity: number
  maxCapacity: number
  damage: DamageState[]
}
