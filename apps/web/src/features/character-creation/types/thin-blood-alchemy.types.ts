export type ThinBloodAlchemyMethod =
  | 'athanorCorporis'
  | 'calcinatio'
  | 'fixatio'

export type ThinBloodAlchemyFormulaKey =
  string

export interface CharacterThinBloodAlchemyDraft {
  rating: number

  method:
    | ThinBloodAlchemyMethod
    | null

  formulaKeys:
    ThinBloodAlchemyFormulaKey[]
}
