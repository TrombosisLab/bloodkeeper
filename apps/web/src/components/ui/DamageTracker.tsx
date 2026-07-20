import type {
  DamageState,
} from '../../features/character-sheet/types/damage-tracker.types'

interface DamageTrackerProps {
  label: string
  capacity: number
  maxCapacity?: number
  damage: DamageState[]
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

export function DamageTracker({
  label,
  capacity,
  maxCapacity = 10,
  damage,
}: DamageTrackerProps) {
  const safeCapacity = Math.max(
    0,
    Math.min(capacity, maxCapacity),
  )

  return (
    <div className="damage-tracker">
      <div className="damage-tracker__header">
        <div>
          <span className="damage-tracker__label">
            {label}
          </span>

          <strong className="damage-tracker__capacity">
            {safeCapacity}
          </strong>
        </div>

        <span className="damage-tracker__maximum">
          Máximo {maxCapacity}
        </span>
      </div>

      <div
        className="damage-tracker__boxes"
        role="img"
        aria-label={`${label}: ${safeCapacity} casillas`}
      >
        {Array.from(
          { length: maxCapacity },
          (_, index) => {
            const available =
              index < safeCapacity

            const state: DamageState =
              available
                ? (damage[index] ?? 'empty')
                : 'empty'

            return (
              <span
                key={index}
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
                title={
                  available
                    ? getDamageLabel(state)
                    : 'Capacidad no disponible'
                }
                aria-hidden="true"
              />
            )
          },
        )}
      </div>
    </div>
  )
}
