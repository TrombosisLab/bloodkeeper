export interface DicePoolComponent {
  readonly key: string
  readonly label: string
  readonly value: number
}

export interface DicePoolModifier {
  readonly key: string
  readonly label: string
  readonly value: number
}

export type DicePoolContextSource =
  | 'manual'
  | 'character'
  | 'action'

export interface DicePoolContext {
  readonly source: DicePoolContextSource
  readonly description?: string | null
}

export interface BuiltDicePoolContext {
  readonly source: DicePoolContextSource
  readonly description: string | null
}

export interface DicePoolBuildInput {
  readonly components: readonly DicePoolComponent[]
  readonly modifier?: number
  readonly modifiers?: readonly DicePoolModifier[]
  readonly hunger: number
  readonly difficulty?: number | null
  readonly context?: DicePoolContext | null
}

export interface BuiltDicePool {
  readonly components: readonly DicePoolComponent[]
  readonly modifiers: readonly DicePoolModifier[]
  readonly basePool: number
  readonly modifier: number
  readonly finalPool: number
  readonly normalDice: number
  readonly hungerDice: number
  readonly difficulty: number | null
  readonly context: BuiltDicePoolContext | null
}
