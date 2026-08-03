import {
  validateCharacterAttributeSkillState,
} from './character-attribute-skill.rules'

import type {
  CharacterAttributeSkillViolation,
} from './character-attribute-skill.rules'

import {
  validateCharacterDamageState,
} from './character-damage.rules'

import {
  validateCharacterHumanityState,
} from './character-humanity-state.rules'

import {
  validateCharacterHunger,
} from './character-hunger.rules'

import type {
  PersistedCharacterDraft,
} from './persisted-character.types'

import type {
  CharacterValidationContributor,
} from './character-validator'

import type {
  CharacterSectionValidation,
  CharacterValidationContext,
  CharacterValidationIssue,
  CharacterValidationSection,
  CharacterValidationSeverity,
} from './character-validation.types'

const bloodPotencyRanges: Record<
  number,
  { min: number; max: number }
> = {
  10: { min: 1, max: 4 },
  11: { min: 1, max: 3 },
  12: { min: 1, max: 3 },
  13: { min: 1, max: 3 },
  14: { min: 0, max: 2 },
  15: { min: 0, max: 1 },
  16: { min: 0, max: 0 },
}

const attributeSkillMessages: Record<
  CharacterAttributeSkillViolation,
  string
> = {
  ATTRIBUTE_RATING_OUT_OF_RANGE:
    'Los Atributos contienen una puntuación no permitida.',
  ATTRIBUTE_DISTRIBUTION_INVALID:
    'La distribución inicial de Atributos está incompleta.',
  SKILL_RATING_OUT_OF_RANGE:
    'Las Habilidades contienen una puntuación no permitida.',
  SKILL_DISTRIBUTION_INVALID:
    'La distribución inicial de Habilidades está incompleta.',
  SKILL_SPECIALTY_EMPTY:
    'Las Especialidades deben tener un nombre.',
  SKILL_SPECIALTY_WITH_ZERO_RATING:
    'Una Especialidad requiere puntuación en su Habilidad.',
  SKILL_SPECIALTY_DUPLICATE:
    'No puede repetirse una Especialidad en la misma Habilidad.',
}

function issue(
  code: string,
  severity: CharacterValidationSeverity,
  section: CharacterValidationSection,
  field: string | null,
  message: string,
): CharacterValidationIssue {
  return {
    code,
    severity,
    section,
    field,
    message,
  }
}

function uniqueIssues(
  issues: readonly CharacterValidationIssue[],
): CharacterValidationIssue[] {
  const codes = new Set<string>()

  return issues.filter((candidate) => {
    if (codes.has(candidate.code)) return false
    codes.add(candidate.code)
    return true
  })
}

function sectionResult(
  section: CharacterValidationSection,
  issues: readonly CharacterValidationIssue[],
): CharacterSectionValidation {
  const normalized = uniqueIssues(issues)

  return {
    section,
    state: normalized.some(
      ({ severity }) => severity === 'error',
    )
      ? 'invalid'
      : normalized.length > 0
        ? 'pending'
        : 'complete',
    issues: normalized,
  }
}

function requiredSeverity(
  context: CharacterValidationContext,
): CharacterValidationSeverity {
  return context === 'draftSave'
    ? 'warning'
    : 'error'
}

function validateIdentity(
  character: PersistedCharacterDraft,
  context: CharacterValidationContext,
): CharacterSectionValidation {
  const severity = requiredSeverity(context)
  const issues: CharacterValidationIssue[] = []
  const requiredText = [
    [
      'name',
      character.identity.name,
      'CHARACTER_NAME_REQUIRED',
    ],
    [
      'concept',
      character.identity.concept,
      'CHARACTER_CONCEPT_REQUIRED',
    ],
    [
      'clanKey',
      character.identity.clanKey,
      'CHARACTER_CLAN_REQUIRED',
    ],
  ] as const

  for (const [field, value, code] of requiredText) {
    if (value === null || value.trim().length === 0) {
      issues.push(
        issue(
          code,
          severity,
          'identity',
          field,
          'Falta información obligatoria de Identidad.',
        ),
      )
    }
  }

  const generation = character.identity.generation

  if (generation === null) {
    issues.push(
      issue(
        'CHARACTER_GENERATION_REQUIRED',
        severity,
        'identity',
        'generation',
        'La Generación es obligatoria.',
      ),
    )
  } else if (
    !Number.isInteger(generation) ||
    bloodPotencyRanges[generation] === undefined
  ) {
    issues.push(
      issue(
        'CHARACTER_GENERATION_INVALID',
        'error',
        'identity',
        'generation',
        'La Generación no está admitida por las reglas implementadas.',
      ),
    )
  }

  if (
    character.identity.clanKey === 'thinBlood' &&
    generation !== null &&
    ![14, 15, 16].includes(generation)
  ) {
    issues.push(
      issue(
        'THIN_BLOOD_GENERATION_INVALID',
        'error',
        'identity',
        'generation',
        'Un Sangre Débil debe ser de generación 14, 15 o 16.',
      ),
    )
  }

  return sectionResult('identity', issues)
}

function belongsToAttributes(
  violation: CharacterAttributeSkillViolation,
): boolean {
  return violation.startsWith('ATTRIBUTE_')
}

function attributeSkillIssue(
  violation: CharacterAttributeSkillViolation,
  severity: CharacterValidationSeverity,
): CharacterValidationIssue {
  const section = belongsToAttributes(violation)
    ? 'attributes'
    : 'skills'

  return issue(
    violation,
    severity,
    section,
    null,
    attributeSkillMessages[violation],
  )
}

function validateAttributesAndSkills(
  character: PersistedCharacterDraft,
  context: CharacterValidationContext,
): CharacterSectionValidation[] {
  const structural =
    validateCharacterAttributeSkillState(
      character.attributes,
      character.skills,
      character.creation.skillDistributionMethod,
      'identity',
      character.skillSpecialties,
    )
  const complete =
    validateCharacterAttributeSkillState(
      character.attributes,
      character.skills,
      character.creation.skillDistributionMethod,
      'review',
      character.skillSpecialties,
    )
  const violations =
    context === 'activation'
      ? complete
      : structural
  const issues = violations.map((violation) =>
    attributeSkillIssue(violation, 'error'),
  )

  if (context === 'draftSave') {
    for (const violation of complete) {
      if (
        !structural.includes(violation) &&
        (violation ===
          'ATTRIBUTE_DISTRIBUTION_INVALID' ||
          violation ===
            'SKILL_DISTRIBUTION_INVALID')
      ) {
        issues.push(
          attributeSkillIssue(
            violation,
            'warning',
          ),
        )
      }
    }
  }

  return [
    sectionResult(
      'attributes',
      issues.filter(
        ({ section }) => section === 'attributes',
      ),
    ),
    sectionResult(
      'skills',
      issues.filter(
        ({ section }) => section === 'skills',
      ),
    ),
  ]
}

function validateBlood(
  character: PersistedCharacterDraft,
  context: CharacterValidationContext,
): CharacterSectionValidation {
  const issues: CharacterValidationIssue[] = []
  const generation = character.identity.generation

  if (
    generation === null ||
    bloodPotencyRanges[generation] === undefined
  ) {
    issues.push(
      issue(
        'BLOOD_GENERATION_REQUIRED',
        requiredSeverity(context),
        'blood',
        'bloodPotency',
        'Selecciona una Generación válida para comprobar la Sangre.',
      ),
    )
  } else {
    const range = bloodPotencyRanges[generation]

    if (
      !Number.isInteger(
        character.blood.bloodPotency,
      ) ||
      character.blood.bloodPotency < range.min ||
      character.blood.bloodPotency > range.max
    ) {
      issues.push(
        issue(
          'BLOOD_POTENCY_INVALID_FOR_GENERATION',
          'error',
          'blood',
          'bloodPotency',
          'La Potencia de Sangre no corresponde a la Generación.',
        ),
      )
    }
  }

  for (
    const violation of
    validateCharacterHunger(character.blood.hunger)
  ) {
    issues.push(
      issue(
        violation,
        'error',
        'blood',
        'hunger',
        'El valor de Hambre debe estar entre 0 y 5.',
      ),
    )
  }

  return sectionResult('blood', issues)
}

function humanityCreationIssues(
  character: PersistedCharacterDraft,
  severity: CharacterValidationSeverity,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const humanity = character.humanity
  const convictionIds = humanity.convictions.map(
    ({ convictionId }) => convictionId,
  )
  const touchstoneIds = humanity.touchstones.map(
    ({ touchstoneId }) => touchstoneId,
  )
  const linkedIds = humanity.convictions
    .map(({ touchstoneId }) => touchstoneId)
    .filter(
      (value): value is string => value !== null,
    )

  if (
    humanity.convictions.length < 1 ||
    humanity.convictions.length > 3
  ) {
    issues.push(
      issue(
        'INITIAL_CONVICTION_COUNT_INVALID',
        severity,
        'humanity',
        'convictions',
        'Debes definir entre 1 y 3 Convicciones.',
      ),
    )
  }

  if (
    convictionIds.some((id) => !id.trim()) ||
    new Set(convictionIds).size !==
      convictionIds.length ||
    humanity.convictions.some(
      ({ text }) => !text.trim(),
    )
  ) {
    issues.push(
      issue(
        'CONVICTION_DATA_INVALID',
        severity,
        'humanity',
        'convictions',
        'Las Convicciones deben tener identidad y descripción válidas.',
      ),
    )
  }

  if (
    touchstoneIds.some((id) => !id.trim()) ||
    new Set(touchstoneIds).size !==
      touchstoneIds.length ||
    humanity.touchstones.some(
      ({ name, relationship }) =>
        !name.trim() || !relationship.trim(),
    )
  ) {
    issues.push(
      issue(
        'TOUCHSTONE_DATA_INVALID',
        severity,
        'humanity',
        'touchstones',
        'Las Piedras de Toque deben tener identidad, nombre y relación válidos.',
      ),
    )
  }

  if (
    linkedIds.some(
      (id) => !id.trim() || !touchstoneIds.includes(id),
    ) ||
    linkedIds.length !== humanity.convictions.length ||
    new Set(linkedIds).size !== linkedIds.length ||
    touchstoneIds.some(
      (id) => !linkedIds.includes(id),
    ) ||
    humanity.touchstones.length !==
      humanity.convictions.length
  ) {
    issues.push(
      issue(
        'CONVICTION_TOUCHSTONE_RELATION_INVALID',
        severity,
        'humanity',
        'touchstones',
        'Cada Convicción debe vincular una Piedra de Toque distinta y existente.',
      ),
    )
  }

  return issues
}

function validateHumanity(
  character: PersistedCharacterDraft,
  context: CharacterValidationContext,
): CharacterSectionValidation {
  const issues =
    validateCharacterHumanityState(
      character.humanity.value,
      character.humanity.stains,
    ).map((violation) =>
      issue(
        violation,
        'error',
        'humanity',
        null,
        'El estado de Humanidad y Manchas no es válido.',
      ),
    )

  if (
    context === 'draftSave' ||
    context === 'activation'
  ) {
    issues.push(
      ...humanityCreationIssues(
        character,
        requiredSeverity(context),
      ),
    )
  }

  return sectionResult('humanity', issues)
}

function validateDerived(
  character: PersistedCharacterDraft,
): CharacterSectionValidation {
  const issues = validateCharacterDamageState(
    character.attributes,
    character.damage,
  ).map((violation) =>
    issue(
      violation,
      'error',
      'derived',
      null,
      'El daño registrado supera los valores derivados permitidos.',
    ),
  )

  return sectionResult('derived', issues)
}

export const characterCoreValidationContributor:
  CharacterValidationContributor = {
  sections: [
    'identity',
    'attributes',
    'skills',
    'blood',
    'humanity',
    'derived',
  ],

  validate(character, context) {
    return [
      validateIdentity(character, context),
      ...validateAttributesAndSkills(
        character,
        context,
      ),
      validateBlood(character, context),
      validateHumanity(character, context),
      validateDerived(character),
    ]
  },
}
