import type {
  CreationStepId,
} from './creation-step.types'

export interface StepValidationResult {
  valid: boolean
  errors: string[]
}

export type StepValidationMap =
  Record<
    CreationStepId,
    StepValidationResult
  >
