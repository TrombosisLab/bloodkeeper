import type {
  DamageTrackerData,
} from '../types/damage-tracker.types'

export const demoHealth: DamageTrackerData = {
  label: 'Salud',
  capacity: 5,
  maxCapacity: 10,
  damage: [
    'superficial',
    'superficial',
    'empty',
    'empty',
    'empty',
  ],
}

export const demoWillpower: DamageTrackerData = {
  label: 'Fuerza de Voluntad',
  capacity: 6,
  maxCapacity: 10,
  damage: [
    'aggravated',
    'superficial',
    'empty',
    'empty',
    'empty',
    'empty',
  ],
}
