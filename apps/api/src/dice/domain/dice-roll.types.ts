export type DiceDieType =
  | 'normal'
  | 'hunger'

export type DiceRollOutcome =
  | 'success'
  | 'failure'
  | 'critical'
  | 'messy_critical'
  | 'bestial_failure'

export type DiceRollSpecialResult =
  | 'none'
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

export interface DiceCriticalPairEvidence {
  readonly firstDieIndex: number
  readonly secondDieIndex: number
  readonly involvesHunger: boolean
}

export interface DiceRollSpecialEvidence {
  readonly criticalTenIndices: readonly number[]
  readonly hungerCriticalTenIndices: readonly number[]
  readonly criticalPairs: readonly DiceCriticalPairEvidence[]
  readonly bestialFailureDieIndices: readonly number[]
}

export interface DiceRollResolution {
  readonly dice: readonly ResolvedDiceRollDie[]
  readonly difficulty: number | null
  readonly regularSuccesses: number
  readonly criticalPairs: number
  readonly criticalBonusSuccesses: number
  readonly totalSuccesses: number
  readonly isSuccessful: boolean
  readonly specialResult: DiceRollSpecialResult
  readonly specialEvidence: DiceRollSpecialEvidence
  readonly outcome: DiceRollOutcome
  readonly meetsDifficulty: boolean | null
}
