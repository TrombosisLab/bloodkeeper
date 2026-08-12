import type {
  BuiltDicePool,
} from './dice-pool.types'

import type {
  DiceRollResolution,
} from './dice-roll.types'

export type DiceHistorySource =
  | 'manual'
  | 'character'
  | 'action'

export type DiceHistoryVisibility =
  | 'contextual'
  | 'private'

export interface DiceRollContextCommand {
  readonly chronicleId?: string
  readonly sessionId?: string
  readonly visibility?: DiceHistoryVisibility
  readonly rerollParentId?: string
}

export interface ValidatedDiceRollContext {
  readonly characterId: string | null
  readonly chronicleId: string | null
  readonly sessionId: string | null
  readonly visibility: DiceHistoryVisibility
  readonly rerollParentId: string | null
}

export interface NewDiceRollRecord
  extends ValidatedDiceRollContext {
  readonly actorId: string
  readonly source: DiceHistorySource
  readonly description: string | null
  readonly rulesVersion: string
  readonly pool: BuiltDicePool
  readonly roll: DiceRollResolution
}

export interface DiceRollRecord
  extends ValidatedDiceRollContext {
  readonly id: string
  readonly actorId: string
  readonly actorDisplayName: string
  readonly source: DiceHistorySource
  readonly description: string | null
  readonly rulesVersion: string
  readonly pool: BuiltDicePool
  readonly roll: DiceRollResolution
  readonly createdAt: Date
}

export interface DiceRollHistoryCursor {
  readonly createdAt: Date
  readonly id: string
}

export type DiceRollHistoryAccessScope =
  | 'actor'
  | 'participant'
  | 'narrator'

export interface DiceRollHistoryQuery {
  readonly viewerId: string
  readonly accessScope: DiceRollHistoryAccessScope
  readonly actorId?: string
  readonly characterId?: string
  readonly chronicleId?: string
  readonly sessionId?: string
  readonly source?: DiceHistorySource
  readonly description?: string
  readonly limit: number
  readonly cursor: DiceRollHistoryCursor | null
}

export interface DiceRollHistoryPage {
  readonly items: readonly DiceRollRecord[]
  readonly nextCursor: DiceRollHistoryCursor | null
}

export interface DiceHistoryCharacterContext {
  readonly ownerId: string
  readonly chronicleId: string | null
}

export interface ListDiceRollHistoryCommand {
  readonly actorId?: string
  readonly characterId?: string
  readonly chronicleId?: string
  readonly sessionId?: string
  readonly source?: DiceHistorySource
  readonly description?: string
  readonly limit: number
  readonly cursor: DiceRollHistoryCursor | null
}
