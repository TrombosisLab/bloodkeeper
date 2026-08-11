import type {
  DiceRandomSource,
} from '../application/dice-random-source'

export class MathRandomDiceSource
  implements DiceRandomSource {
  rollD10(): number {
    return Math.floor(Math.random() * 10) + 1
  }
}
