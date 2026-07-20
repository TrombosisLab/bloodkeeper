export type CreationStepId =
  | 'identity'
  | 'attributes'
  | 'skills'
  | 'blood'
  | 'disciplines'
  | 'advantages'
  | 'humanity'
  | 'review'

export interface CreationStep {
  id: CreationStepId
  number: number
  title: string
  shortTitle: string
  description: string
}
