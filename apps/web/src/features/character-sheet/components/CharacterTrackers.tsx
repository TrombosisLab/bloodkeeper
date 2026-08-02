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
        track={demoHealth.track}
      />

      <DamageTracker
        label={demoWillpower.label}
        capacity={demoWillpower.capacity}
        track={demoWillpower.track}
      />
    </div>
  )
}
