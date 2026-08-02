import type {
  CharacterHumanityState,
  HumanityBoxState,
} from '../domain/humanity-state-rules'
import {
  canSetHumanityStains,
  canSetHumanityValue,
  setHumanityStains,
  setHumanityValue,
  toHumanityBoxStates,
} from '../domain/humanity-state-rules'

interface HumanityTrackBaseProps {
  state: CharacterHumanityState
}

type HumanityTrackProps =
  HumanityTrackBaseProps & (
    | {
        mode?: 'readOnly'
        onChange?: never
      }
    | {
        mode: 'editable'
        onChange: (
          state: CharacterHumanityState,
        ) => void
      }
  )

function getBoxLabel(
  state: HumanityBoxState,
): string {
  switch (state) {
    case 'humanity':
      return 'Humanidad'

    case 'stain':
      return 'Mancha'

    default:
      return 'Vacía'
  }
}

function getBoxSymbol(
  state: HumanityBoxState,
): string {
  switch (state) {
    case 'humanity':
      return '◆'

    case 'stain':
      return '×'

    default:
      return ''
  }
}

export function HumanityTrack({
  state,
  mode = 'readOnly',
  onChange,
}: HumanityTrackProps) {
  const boxes = toHumanityBoxStates(state)

  const humanityCanDecrease =
    canSetHumanityValue(
      state,
      state.value - 1,
    )
  const humanityCanIncrease =
    canSetHumanityValue(
      state,
      state.value + 1,
    )
  const stainsCanDecrease =
    canSetHumanityStains(
      state,
      state.stains - 1,
    )
  const stainsCanIncrease =
    canSetHumanityStains(
      state,
      state.stains + 1,
    )

  return (
    <>
      <div
        className="humanity-track"
        role="list"
        aria-label={`Humanidad ${state.value} de 10; ${state.stains} Manchas`}
      >
        {boxes.map((boxState, index) => (
          <span
            key={index}
            role="listitem"
            className={[
              'humanity-box',
              `humanity-box--${boxState}`,
            ].join(' ')}
            aria-label={`Casilla ${index + 1}: ${getBoxLabel(boxState)}`}
            title={getBoxLabel(boxState)}
          >
            <span
              className="humanity-box__symbol"
              aria-hidden="true"
            >
              {getBoxSymbol(boxState)}
            </span>
          </span>
        ))}
      </div>

      {mode === 'editable' ? (
        <div
          className="humanity-track__controls"
          aria-label="Editar Humanidad y Manchas"
        >
          <button
            type="button"
            disabled={!humanityCanDecrease}
            onClick={() =>
              onChange?.(
                setHumanityValue(
                  state,
                  state.value - 1,
                ),
              )
            }
          >
            Humanidad −
          </button>

          <button
            type="button"
            disabled={!humanityCanIncrease}
            onClick={() =>
              onChange?.(
                setHumanityValue(
                  state,
                  state.value + 1,
                ),
              )
            }
          >
            Humanidad +
          </button>

          <button
            type="button"
            disabled={!stainsCanDecrease}
            onClick={() =>
              onChange?.(
                setHumanityStains(
                  state,
                  state.stains - 1,
                ),
              )
            }
          >
            Mancha −
          </button>

          <button
            type="button"
            disabled={!stainsCanIncrease}
            onClick={() =>
              onChange?.(
                setHumanityStains(
                  state,
                  state.stains + 1,
                ),
              )
            }
          >
            Mancha +
          </button>
        </div>
      ) : null}
    </>
  )
}
