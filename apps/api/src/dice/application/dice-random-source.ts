export const DICE_RANDOM_SOURCE = Symbol(
  'DICE_RANDOM_SOURCE',
)

export interface DiceRandomSource {
  rollD10(): number
}
