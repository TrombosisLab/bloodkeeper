export type DiceDieType =
  | 'normal'
  | 'hunger'

export type DiceRollOutcome =
  | 'success'
  | 'failure'
  | 'critical'
  | 'messy_critical'
  | 'bestial_failure'

export interface DiceRollDieInput {
  readonly value: number
  readonly type: DiceDieType
}

export interface DiceRollInput {
  readonly dice: readonly DiceRollDieInput[]
  readonly difficulty?: number | null
}

export interface ResolvedDiceRollDie
  extends DiceRollDieInput {
  readonly isSuccess: boolean
  readonly isCriticalTen: boolean
  readonly isBestialFailureDie: boolean
}

export interface DiceRollResolution {
  readonly dice: readonly ResolvedDiceRollDie[]
  readonly difficulty: number | null
  readonly regularSuccesses: number
  readonly criticalPairs: number
  readonly criticalBonusSuccesses: number
  readonly totalSuccesses: number
  readonly outcome: DiceRollOutcome
  readonly meetsDifficulty: boolean | null
}
