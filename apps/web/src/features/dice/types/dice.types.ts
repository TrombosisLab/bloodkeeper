export type DiceDieType = 'normal' | 'hunger'

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
  readonly description: string | null
}

export interface DicePoolSnapshot {
  readonly components: readonly DicePoolComponent[]
  readonly modifiers: readonly DicePoolModifier[]
  readonly basePool: number
  readonly modifier: number
  readonly finalPool: number
  readonly normalDice: number
  readonly hungerDice: number
  readonly difficulty: number | null
  readonly context: DicePoolContext | null
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
  readonly isSuccessful: boolean
  readonly specialResult: DiceRollSpecialResult
  readonly specialEvidence: DiceRollSpecialEvidence
  readonly outcome: DiceRollOutcome
  readonly meetsDifficulty: boolean | null
}

export interface ExecutedDiceRoll {
  readonly pool: DicePoolSnapshot
  readonly roll: DiceRollSnapshot
}

interface DicePoolCommandOptions {
  readonly modifier?: number
  readonly modifiers?: readonly DicePoolModifier[]
  readonly difficulty?: number | null
  readonly description?: string | null
}

export interface ManualDiceRollCommand
  extends DicePoolCommandOptions {
  readonly pool: number
  readonly hunger: number
}

export interface CharacterDiceRollCommand
  extends DicePoolCommandOptions {
  readonly attribute: string
  readonly skill?: string
}

export interface DiceGateway {
  previewManual(
    command: ManualDiceRollCommand,
  ): Promise<DicePoolSnapshot>
  manual(
    command: ManualDiceRollCommand,
  ): Promise<ExecutedDiceRoll>
  previewCharacter(
    characterId: string,
    command: CharacterDiceRollCommand,
  ): Promise<DicePoolSnapshot>
  character(
    characterId: string,
    command: CharacterDiceRollCommand,
  ): Promise<ExecutedDiceRoll>
}

export interface DiceTraitOption {
  readonly key: string
  readonly label: string
}
