import {
  validateAttributeDistribution,
} from './attribute-rules'

import type {
  CharacterDraft,
} from '../types/character-draft.types'

import type {
  CreationStepId,
} from '../types/creation-step.types'

import type {
  StepValidationMap,
  StepValidationResult,
} from '../types/step-validation.types'

function valid(): StepValidationResult {
  return {
    valid: true,
    errors: [],
  }
}

export function validateIdentityStep(
  draft: CharacterDraft,
): StepValidationResult {
  const errors: string[] = []

  if (!draft.identity.name.trim()) {
    errors.push(
      'El nombre del personaje es obligatorio.',
    )
  }

  if (!draft.identity.concept.trim()) {
    errors.push(
      'El concepto es obligatorio.',
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateAttributesStep(
  draft: CharacterDraft,
): StepValidationResult {
  const result =
    validateAttributeDistribution(
      draft.attributes,
    )

  return {
    valid: result.valid,
    errors: result.errors,
  }
}

export function validateStep(
  stepId: CreationStepId,
  draft: CharacterDraft,
): StepValidationResult {
  switch (stepId) {
    case 'identity':
      return validateIdentityStep(draft)

    case 'attributes':
      return validateAttributesStep(draft)

    default:
      return valid()
  }
}

export function buildStepValidationMap(
  draft: CharacterDraft,
): StepValidationMap {
  return {
    identity:
      validateStep(
        'identity',
        draft,
      ),

    attributes:
      validateStep(
        'attributes',
        draft,
      ),

    skills:
      validateStep(
        'skills',
        draft,
      ),

    blood:
      validateStep(
        'blood',
        draft,
      ),

    disciplines:
      validateStep(
        'disciplines',
        draft,
      ),

    advantages:
      validateStep(
        'advantages',
        draft,
      ),

    humanity:
      validateStep(
        'humanity',
        draft,
      ),

    review:
      validateStep(
        'review',
        draft,
      ),
  }
}
