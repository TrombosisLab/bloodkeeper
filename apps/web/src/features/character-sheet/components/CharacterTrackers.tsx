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
  healthCapacity?: number
  willpower: CharacterDamageTrack
  willpowerCapacity?: number
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
  healthCapacity =
    demoHealth.capacity,
  willpower,
  willpowerCapacity =
    demoWillpower.capacity,
  stateEditing,
  onHealthChange,
  onWillpowerChange,
}: CharacterTrackersProps) {
  return (
    <div className="character-trackers">
      {stateEditing ? (
        <DamageTracker
          label={demoHealth.label}
          capacity={healthCapacity}
          track={health}
          mode="editable"
          onChange={onHealthChange}
        />
      ) : (
        <DamageTracker
          label={demoHealth.label}
          capacity={healthCapacity}
          track={health}
        />
      )}

      {stateEditing ? (
        <DamageTracker
          label={demoWillpower.label}
          capacity={willpowerCapacity}
          track={willpower}
          mode="editable"
          onChange={onWillpowerChange}
        />
      ) : (
        <DamageTracker
          label={demoWillpower.label}
          capacity={willpowerCapacity}
          track={willpower}
        />
      )}
    </div>
  )
}
