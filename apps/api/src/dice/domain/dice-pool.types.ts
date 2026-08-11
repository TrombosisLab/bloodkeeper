export interface DicePoolComponent {
  readonly key: string
  readonly label: string
  readonly value: number
}

export interface DicePoolBuildInput {
  readonly components: readonly DicePoolComponent[]
  readonly modifier?: number
  readonly hunger: number
  readonly difficulty?: number | null
}

export interface BuiltDicePool {
  readonly components: readonly DicePoolComponent[]
  readonly basePool: number
  readonly modifier: number
  readonly finalPool: number
  readonly normalDice: number
  readonly hungerDice: number
  readonly difficulty: number | null
}
