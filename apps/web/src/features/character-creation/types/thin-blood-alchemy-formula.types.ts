export type ThinBloodAlchemyFormulaSource =
  | 'core'
  | 'playersGuide'
  | 'bloodSigils'

export type ThinBloodAlchemyFormulaKind =
  | 'named'
  | 'imitatedDisciplinePower'
  | 'custom'

export type ThinBloodAlchemyFormulaLevel =
  | 1
  | 2
  | 3
  | 4
  | 5

export interface ThinBloodAlchemyFormulaDefinition {
  key: string
  name: string
  level: ThinBloodAlchemyFormulaLevel
  source: ThinBloodAlchemyFormulaSource
  sourcePage?: number
  kind: ThinBloodAlchemyFormulaKind
  relatedFormulaKeys?: string[]
  tags?: string[]
}
