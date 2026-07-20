import { DamageTracker } from '../../../components/ui/DamageTracker'

import {
  demoHealth,
  demoWillpower,
} from '../data/demo-trackers'

export function CharacterTrackers() {
  return (
    <div className="character-trackers">
      <DamageTracker
        label={demoHealth.label}
        capacity={demoHealth.capacity}
        maxCapacity={demoHealth.maxCapacity}
        damage={demoHealth.damage}
      />

      <DamageTracker
        label={demoWillpower.label}
        capacity={demoWillpower.capacity}
        maxCapacity={demoWillpower.maxCapacity}
        damage={demoWillpower.damage}
      />
    </div>
  )
}
