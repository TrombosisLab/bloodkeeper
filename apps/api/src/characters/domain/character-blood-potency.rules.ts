export interface CharacterBloodPotencyRange {
  readonly min: number
  readonly max: number
}

export const characterBloodPotencyRanges:
  Readonly<Record<number, CharacterBloodPotencyRange>> = {
    10: { min: 1, max: 4 },
    11: { min: 1, max: 3 },
    12: { min: 1, max: 3 },
    13: { min: 1, max: 3 },
    14: { min: 0, max: 2 },
    15: { min: 0, max: 1 },
    16: { min: 0, max: 0 },
  }
