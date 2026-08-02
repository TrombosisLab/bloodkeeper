import type {
  CharacterHumanityState,
  HumanityBoxState,
} from '../domain/humanity-state-rules'
import {
  toHumanityBoxStates,
} from '../domain/humanity-state-rules'

interface HumanityTrackProps {
  state: CharacterHumanityState
}

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
}: HumanityTrackProps) {
  const boxes = toHumanityBoxStates(state)

  return (
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
  )
}
