import type {
  CharacterDamageTrack,
  DamageState,
} from '../../features/character-sheet/domain/damage-track-rules'
import {
  MAX_DAMAGE_TRACK_CAPACITY,
  toDamageStates,
} from '../../features/character-sheet/domain/damage-track-rules'

interface DamageTrackerProps {
  label: string
  capacity: number
  track: CharacterDamageTrack
}

function getDamageLabel(
  state: DamageState,
): string {
  switch (state) {
    case 'superficial':
      return 'Daño superficial'

    case 'aggravated':
      return 'Daño agravado'

    default:
      return 'Sin daño'
  }
}

function getDamageSymbol(
  state: DamageState,
): string {
  switch (state) {
    case 'superficial':
      return '/'

    case 'aggravated':
      return '×'

    default:
      return ''
  }
}

export function DamageTracker({
  label,
  capacity,
  track,
}: DamageTrackerProps) {
  const damage = toDamageStates(
    capacity,
    track,
  )

  const summary = [
    `${track.superficial} daño superficial`,
    `${track.aggravated} daño agravado`,
    `${capacity - track.superficial - track.aggravated} sin daño`,
  ].join(', ')

  return (
    <div className="damage-tracker">
      <div className="damage-tracker__header">
        <div>
          <span className="damage-tracker__label">
            {label}
          </span>

          <strong className="damage-tracker__capacity">
            {capacity}
          </strong>
        </div>

        <span className="damage-tracker__maximum">
          Máximo {MAX_DAMAGE_TRACK_CAPACITY}
        </span>
      </div>

      <div
        className="damage-tracker__boxes"
        role="list"
        aria-label={`${label}: ${summary}`}
      >
        {Array.from(
          {
            length:
              MAX_DAMAGE_TRACK_CAPACITY,
          },
          (_, index) => {
            const available = index < capacity

            const state: DamageState =
              available
                ? (damage[index] ?? 'empty')
                : 'empty'

            const stateLabel = available
              ? getDamageLabel(state)
              : 'Capacidad no disponible'

            return (
              <span
                key={index}
                role="listitem"
                className={[
                  'damage-box',

                  available
                    ? 'damage-box--available'
                    : 'damage-box--unavailable',

                  available &&
                  state === 'superficial'
                    ? 'damage-box--superficial'
                    : '',

                  available &&
                  state === 'aggravated'
                    ? 'damage-box--aggravated'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={stateLabel}
                aria-label={`Casilla ${index + 1}: ${stateLabel}`}
              >
                <span
                  className="damage-box__symbol"
                  aria-hidden="true"
                >
                  {available
                    ? getDamageSymbol(state)
                    : ''}
                </span>
              </span>
            )
          },
        )}
      </div>
    </div>
  )
}
