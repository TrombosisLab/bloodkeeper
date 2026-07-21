import {
  BLOOD_SORCERY_RITUAL_DEFINITIONS,
} from '../data/blood-sorcery-ritual-definitions.ts'

import {
  oblivionCeremonyDefinitions,
} from '../data/oblivion-ceremony-definitions.ts'

import {
  getLearnableInitialOblivionCeremonies,
  validateInitialOblivionCeremonySelection,
} from './oblivion-ceremony-rules.ts'

import {
  validateInitialBloodSorceryRituals,
} from './blood-sorcery-ritual-rules.ts'

import {
  getDisciplineValue,
} from './discipline-rules.ts'

import {
  disciplinePowerDefinitions,
} from '../data/discipline-power-definitions.ts'

import {
  validateSelectedPowers,
} from './discipline-power-rules.ts'

import {
  validateAttributeDistribution,
} from './attribute-rules.ts'

import {
  validateSkillDistribution,
} from './skill-rules.ts'

import {
  validateBloodDraft,
} from './blood-rules.ts'

import {
  validateDisciplines,
} from './discipline-rules.ts'

import type {
  CharacterDraft,
} from '../types/character-draft.types.ts'

import type {
  CreationStepId,
} from '../types/creation-step.types.ts'

import type {
  StepValidationMap,
  StepValidationResult,
} from '../types/step-validation.types.ts'

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

export function validateDisciplinesStepBase(
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


export function validateDisciplinesStep(
  draft: CharacterDraft,
): StepValidationResult {
  const base =
    validateDisciplinesStepBase(
      draft,
    )

  const ritualValidation =
    validateInitialBloodSorceryRituals(
      BLOOD_SORCERY_RITUAL_DEFINITIONS,
      draft.bloodSorceryRituals.ritualKeys,
      getDisciplineValue(
        draft.disciplines,
        'bloodSorcery',
      ),
    )

  const oblivion =
    draft.disciplines.find(
      (discipline) =>
        discipline.key ===
        'oblivion',
    )

  const oblivionLevel =
    oblivion?.value ?? 0

  const oblivionPowerKeys =
    oblivion?.powerKeys ?? []

  const learnableCeremonies =
    getLearnableInitialOblivionCeremonies(
      oblivionCeremonyDefinitions,
      oblivionLevel,
      oblivionPowerKeys,
    )

  const ceremonyValidation =
    validateInitialOblivionCeremonySelection(
      oblivionCeremonyDefinitions,
      draft.oblivionCeremonies.ceremonyKeys,
      oblivionLevel,
      oblivionPowerKeys,
    )

  const ceremonyErrors = [
    ...ceremonyValidation.errors,
  ]

  if (
    learnableCeremonies.length > 0 &&
    draft.oblivionCeremonies
      .ceremonyKeys.length !== 1
  ) {
    ceremonyErrors.push(
      'Debes seleccionar exactamente una Ceremonia inicial de Olvido.',
    )
  }

  return {
    valid:
      base.valid &&
      ritualValidation.valid &&
      ceremonyErrors.length === 0,

    errors: [
      ...base.errors,
      ...ritualValidation.errors,
      ...new Set(
        ceremonyErrors,
      ),
    ],
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

    case 'disciplines': {
      const base =
        validateDisciplinesStep(
          draft,
        )

      if (!base.valid) {
        return base
      }

      const powerErrors: string[] = []

      for (
        const discipline of
        draft.disciplines
      ) {
        if (
          discipline.value <= 0
        ) {
          continue
        }

        const result =
          validateSelectedPowers(
            disciplinePowerDefinitions,
            draft.disciplines,
            discipline.key,
            discipline.powerKeys,
          )

        powerErrors.push(
          ...result.errors,
        )
      }

      return {
        valid:
          powerErrors.length === 0,

        errors: [
          ...new Set(
            powerErrors,
          ),
        ],
      }
    }

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
