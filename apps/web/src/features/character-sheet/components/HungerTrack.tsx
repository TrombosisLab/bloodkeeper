import {
  CHARACTER_HUNGER_MAX,
  increaseCharacterHunger,
  normalizeCharacterHunger,
  reduceCharacterHunger,
} from '../../character/domain/hunger-rules'

interface HungerTrackBaseProps {
  value: number
}

type HungerTrackProps =
  HungerTrackBaseProps & (
    | {
        mode?: 'readOnly'
        onChange?: never
      }
    | {
        mode: 'editable'
        onChange: (
          value: number,
        ) => void
      }
  )

export function HungerTrack({
  value,
  mode = 'readOnly',
  onChange,
}: HungerTrackProps) {
  const safeValue =
    normalizeCharacterHunger(
      value,
    )

  const increase =
    increaseCharacterHunger(
      safeValue,
    )
  const reduction =
    reduceCharacterHunger(
      safeValue,
    )

  return (
    <>
      <div
        className="hunger-track"
        role="list"
        aria-label={`Hambre ${safeValue} de ${CHARACTER_HUNGER_MAX}`}
      >
        {Array.from(
          {
            length:
              CHARACTER_HUNGER_MAX,
          },
          (_, index) => {
            const filled =
              index < safeValue

            return (
              <span
                key={index}
                role="listitem"
                className={
                  filled
                    ? 'hunger-drop hunger-drop--filled'
                    : 'hunger-drop'
                }
                aria-label={`Nivel ${index + 1}: ${filled ? 'activo' : 'vacío'}`}
              />
            )
          },
        )}
      </div>

      {mode === 'editable' ? (
        <div
          className="hunger-track__controls"
          aria-label="Editar Hambre"
        >
          <button
            type="button"
            disabled={!reduction.valid}
            onClick={() => {
              if (reduction.valid) {
                onChange?.(
                  reduction.value,
                )
              }
            }}
          >
            Hambre −
          </button>

          <button
            type="button"
            disabled={!increase.valid}
            onClick={() => {
              if (increase.valid) {
                onChange?.(
                  increase.value,
                )
              }
            }}
          >
            Hambre +
          </button>
        </div>
      ) : null}
    </>
  )
}
