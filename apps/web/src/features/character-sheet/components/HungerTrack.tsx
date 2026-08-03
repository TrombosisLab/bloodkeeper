import {
  CHARACTER_HUNGER_MAX,
  normalizeCharacterHunger,
} from '../../character/domain/hunger-rules'

interface HungerTrackProps {
  value: number
}

export function HungerTrack({
  value,
}: HungerTrackProps) {
  const safeValue =
    normalizeCharacterHunger(
      value,
    )

  return (
    <div className="hunger-track">
      {Array.from(
        {
          length:
            CHARACTER_HUNGER_MAX,
        },
        (_, index) => (
          <span
            key={index}
            className={
              index < safeValue
                ? 'hunger-drop hunger-drop--filled'
                : 'hunger-drop'
            }
            aria-hidden="true"
          />
        ),
      )}

      <span className="sr-only">
        Hambre {safeValue} de{' '}
        {CHARACTER_HUNGER_MAX}
      </span>
    </div>
  )
}
