import { DamageTracker } from '../../../components/ui/DamageTracker'

import {
  demoHealth,
  demoWillpower,
} from '../data/demo-trackers'
import type {
  CharacterDamageTrack,
} from '../domain/damage-track-rules'

interface CharacterTrackersProps {
  health: CharacterDamageTrack
  willpower: CharacterDamageTrack
  stateEditing: boolean
  onHealthChange: (
    track: CharacterDamageTrack,
  ) => void
  onWillpowerChange: (
    track: CharacterDamageTrack,
  ) => void
}

export function CharacterTrackers({
  health,
  willpower,
  stateEditing,
  onHealthChange,
  onWillpowerChange,
}: CharacterTrackersProps) {
  return (
    <div className="character-trackers">
      {stateEditing ? (
        <DamageTracker
          label={demoHealth.label}
          capacity={demoHealth.capacity}
          track={health}
          mode="editable"
          onChange={onHealthChange}
        />
      ) : (
        <DamageTracker
          label={demoHealth.label}
          capacity={demoHealth.capacity}
          track={health}
        />
      )}

      {stateEditing ? (
        <DamageTracker
          label={demoWillpower.label}
          capacity={demoWillpower.capacity}
          track={willpower}
          mode="editable"
          onChange={onWillpowerChange}
        />
      ) : (
        <DamageTracker
          label={demoWillpower.label}
          capacity={demoWillpower.capacity}
          track={willpower}
        />
      )}
    </div>
  )
}
