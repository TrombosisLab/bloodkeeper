import {
  validateAttributeDistribution,
} from './attribute-rules'

import {
  validateSkillDistribution,
} from './skill-rules'

import {
  validateBloodDraft,
} from './blood-rules'

import {
  validateDisciplines,
} from './discipline-rules'

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

  if (draft.identity.clan === null) {
    errors.push(
      'El clan es obligatorio.',
    )
  }

  if (draft.identity.generation === null) {
    errors.push(
      'La generación es obligatoria.',
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

export function validateSkillsStep(
  draft: CharacterDraft,
): StepValidationResult {
  const result =
    validateSkillDistribution(
      draft.skills,
      draft.skillDistributionMethod,
    )

  return {
    valid: result.valid,
    errors: result.errors,
  }
}

export function validateBloodStep(
  draft: CharacterDraft,
): StepValidationResult {
  const result =
    validateBloodDraft(
      draft.blood,
      draft.identity.generation,
    )

  return {
    valid: result.valid,
    errors: result.errors,
  }
}

export function validateDisciplinesStep(
  draft: CharacterDraft,
): StepValidationResult {
  const result =
    validateDisciplines(
      draft.disciplines,
      draft.identity.clan,
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

    case 'skills':
      return validateSkillsStep(draft)

    case 'blood':
      return validateBloodStep(draft)

    case 'disciplines':
      return validateDisciplinesStep(draft)

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
