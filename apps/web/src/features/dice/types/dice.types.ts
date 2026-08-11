export type DiceDieType = 'normal' | 'hunger'

export type DiceRollOutcome =
  | 'success'
  | 'failure'
  | 'critical'
  | 'messy_critical'
  | 'bestial_failure'

export interface DicePoolComponent {
  readonly key: string
  readonly label: string
  readonly value: number
}

export interface DicePoolSnapshot {
  readonly components: readonly DicePoolComponent[]
  readonly basePool: number
  readonly modifier: number
  readonly finalPool: number
  readonly normalDice: number
  readonly hungerDice: number
  readonly difficulty: number | null
}

export interface ResolvedDice {
  readonly value: number
  readonly type: DiceDieType
  readonly isSuccess: boolean
  readonly isCriticalTen: boolean
  readonly isBestialFailureDie: boolean
}

export interface DiceRollSnapshot {
  readonly dice: readonly ResolvedDice[]
  readonly difficulty: number | null
  readonly regularSuccesses: number
  readonly criticalPairs: number
  readonly criticalBonusSuccesses: number
  readonly totalSuccesses: number
  readonly outcome: DiceRollOutcome
  readonly meetsDifficulty: boolean | null
}

export interface ExecutedDiceRoll {
  readonly pool: DicePoolSnapshot
  readonly roll: DiceRollSnapshot
}

export interface ManualDiceRollCommand {
  readonly pool: number
  readonly hunger: number
  readonly modifier?: number
  readonly difficulty?: number | null
}

export interface CharacterDiceRollCommand {
  readonly attribute: string
  readonly skill?: string
  readonly modifier?: number
  readonly difficulty?: number | null
}

export interface DiceGateway {
  manual(command: ManualDiceRollCommand): Promise<ExecutedDiceRoll>
  character(
    characterId: string,
    command: CharacterDiceRollCommand,
  ): Promise<ExecutedDiceRoll>
}

export interface DiceTraitOption {
  readonly key: string
  readonly label: string
}
