import {
  validatePredatorTypeChoiceSelections,
} from './predator-type-rules.ts'

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
  resolvePermanentDisciplines,
} from './permanent-discipline-rules.ts'

import {
  disciplinePowerDefinitions,
} from '../data/discipline-power-definitions.ts'

import {
  getSelectedDisciplinePowerKeys,
  validateInitialDisciplinePowers,
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
  validateCharacterAdvantagesForContext,
} from './advantage-acquisition-context-rules.ts'

import {
  validateCharacterAdvantageRegulatoryState,
} from './character-advantage-regulatory-rules.ts'

import {
  characterAdvantageDefinitions,
} from '../data/character-advantage-definitions.ts'


import {
  validateInitialThinBloodAlchemySelection,
} from './thin-blood-alchemy-rules.ts'

import {
  validateInitialHumanity,
} from './humanity-rules.ts'

import {
  validateAdvantageRelations,
} from './advantage-relation-rules.ts'


import {
  validateThinBloodTraitsForCharacterKind,
} from './thin-blood-trait-rules.ts'

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

  if (
    draft.identity.clan === 'thinBlood' &&
    draft.identity.generation !== null &&
    ![14, 15, 16].includes(
      draft.identity.generation,
    )
  ) {
    errors.push(
      'Los Sangre Débil solo pueden tener generación 14, 15 o 16.',
    )
  }

  const predatorTypeChoiceValidation =
    validatePredatorTypeChoiceSelections(
      draft.identity.predatorType,
      {
        clan:
          draft.identity.clan,
      },
      draft.predatorTypeChoices ?? {},
    )

  errors.push(
    ...predatorTypeChoiceValidation.errors,
  )

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
  /*
   * El reparto inicial 2 + 1 pertenece exclusivamente
   * a las Disciplinas elegidas durante la creación.
   *
   * Las concesiones posteriores del Tipo de Depredador
   * se validan por su propio origen y no deben alterar
   * ni el catálogo de clan ni el presupuesto inicial.
   *
   * La ausencia de origin se conserva como creación
   * para mantener compatibilidad con borradores previos.
   */
  const creationDisciplines =
    draft.disciplines.filter(
      discipline =>
        discipline.origin === undefined ||
        discipline.origin === 'creation',
    )

  const result =
    validateDisciplines(
      creationDisciplines,
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

  const permanentDisciplines =
    resolvePermanentDisciplines(
      draft,
    )

  const ritualValidation =
    validateInitialBloodSorceryRituals(
      BLOOD_SORCERY_RITUAL_DEFINITIONS,
      draft.bloodSorceryRituals.ritualKeys,
      getDisciplineValue(
        permanentDisciplines,
        'bloodSorcery',
      ),
    )

  const oblivion =
    permanentDisciplines.find(
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

    case 'advantages': {
      const advantageValidation =
        validateCharacterAdvantagesForContext(
          draft.advantages,
          'characterCreation',
        )

      const regulatoryValidation =
        validateCharacterAdvantageRegulatoryState(
          draft,
        )

      const characterKind =
        draft.identity.clan ===
          'thinBlood'
          ? 'thinBlood'
          : 'clan'

      const thinBloodValidation =
        validateThinBloodTraitsForCharacterKind(
          draft.thinBloodTraits,
          characterKind,
        )

      const alchemyValidation =
        validateInitialThinBloodAlchemySelection(
          draft.thinBloodAlchemy,
          draft.identity.clan,
          draft.thinBloodTraits,
        )

      const parentValidation =
        validateAdvantageRelations(
          draft.advantages,
          characterAdvantageDefinitions,
        )

      const errors = [
        ...advantageValidation.errors,
        ...regulatoryValidation.errors,
        ...thinBloodValidation.errors,
        ...alchemyValidation.errors,
        ...parentValidation.errors,
      ]

      return {
        valid:
          advantageValidation.valid &&
          regulatoryValidation.valid &&
          thinBloodValidation.valid &&
          alchemyValidation.valid &&
          parentValidation.valid,

        errors: [
          ...new Set(
            errors,
          ),
        ],
      }
    }

    case 'humanity': {
      const result =
        validateInitialHumanity(
          draft.humanity,
        )

      return {
        valid: result.valid,
        errors: result.errors,
      }
    }

    case 'disciplines': {
      const base =
        validateDisciplinesStep(
          draft,
        )

      if (!base.valid) {
        return base
      }

      const powerErrors: string[] = []

      const disciplineKeys = [
        ...new Set(
          draft.disciplines
            .filter(
              discipline =>
                discipline.value > 0,
            )
            .map(
              discipline =>
                discipline.key,
            ),
        ),
      ]

      for (
        const disciplineKey of
        disciplineKeys
      ) {
        const result =
          validateInitialDisciplinePowers(
            disciplinePowerDefinitions,
            draft.disciplines,
            disciplineKey,
            getSelectedDisciplinePowerKeys(
              draft.disciplines,
              disciplineKey,
            ),
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
