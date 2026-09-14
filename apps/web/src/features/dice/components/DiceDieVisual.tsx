import type {
  ResolvedDice,
} from '../types/dice.types.ts'

import './dice-die-visual.css'

type DiceDieVisualProps = Pick<
  ResolvedDice,
  'value' | 'type' | 'isCriticalTen' | 'isBestialFailureDie'
>

function assetForDie(die: DiceDieVisualProps): string {
  if (die.type === 'hunger' && (die.value === 1 || die.isBestialFailureDie)) {
    return 'hunger-bestial-1.png'
  }

  if (die.value === 10 || die.isCriticalTen) {
    return die.type === 'hunger'
      ? 'hunger-critical-10.png'
      : 'normal-critical-10.png'
  }

  if (die.value >= 6) {
    return die.type === 'hunger'
      ? 'hunger-success-6-9.png'
      : 'normal-success-6-9.png'
  }

  return die.type === 'hunger'
    ? 'hunger-fail-2-5.png'
    : 'normal-fail-1-5.png'
}

export function DiceDieVisual({ die }: { readonly die: DiceDieVisualProps }) {
  return (
    <img
      className="dice-die-visual"
      src={`/assets/dice/${assetForDie(die)}`}
      alt=""
      aria-hidden="true"
      title={`${die.type === 'hunger' ? 'Dado de Hambre' : 'Dado normal'} · resultado ${die.value}`}
    />
  )
}
