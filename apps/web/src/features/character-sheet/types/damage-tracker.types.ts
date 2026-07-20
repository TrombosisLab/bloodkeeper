export type DamageState =
  | 'empty'
  | 'superficial'
  | 'aggravated'

export interface DamageTrackerData {
  label: string
  capacity: number
  maxCapacity: number
  damage: DamageState[]
}
