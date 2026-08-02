import type {
  DamageTrackerData,
} from '../types/damage-tracker.types'

export const demoHealth: DamageTrackerData = {
  label: 'Salud',
  capacity: 5,
  track: {
    superficial: 2,
    aggravated: 0,
  },
}

export const demoWillpower: DamageTrackerData = {
  label: 'Fuerza de Voluntad',
  capacity: 6,
  track: {
    superficial: 1,
    aggravated: 1,
  },
}
