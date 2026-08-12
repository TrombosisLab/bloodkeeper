import type {
  DiceHistoryCharacterContext,
  DiceRollHistoryPage,
  DiceRollHistoryQuery,
  DiceRollRecord,
  NewDiceRollRecord,
} from '../domain/dice-history.types'

export const DICE_ROLL_REPOSITORY =
  Symbol('DICE_ROLL_REPOSITORY')

export interface DiceRollRepository {
  create(
    data: NewDiceRollRecord,
  ): Promise<DiceRollRecord>

  findById(
    id: string,
  ): Promise<DiceRollRecord | null>

  findCharacterContext(
    characterId: string,
  ): Promise<DiceHistoryCharacterContext | null>

  list(
    query: DiceRollHistoryQuery,
  ): Promise<DiceRollHistoryPage>
}
