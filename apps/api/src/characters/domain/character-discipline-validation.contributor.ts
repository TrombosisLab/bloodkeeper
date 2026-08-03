import type {
  PersistedCharacterDraft,
} from './persisted-character.types'

import type {
  CharacterValidationContributor,
} from './character-validator'

import type {
  CharacterSectionValidation,
  CharacterValidationIssue,
} from './character-validation.types'

function issue(
  code: string,
  field: string | null,
  message: string,
  details?: Readonly<
    Record<string, string | number | boolean | null>
  >,
): CharacterValidationIssue {
  return {
    code,
    severity: 'error',
    section: 'disciplines',
    field,
    message,
    details,
  }
}

function duplicateValues(
  values: readonly string[],
): string[] {
  const seen = new Set<string>()
  const duplicated = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) duplicated.add(value)
    seen.add(value)
  }

  return [...duplicated]
}

function validateDisciplines(
  character: PersistedCharacterDraft,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const disciplineKeys =
    character.disciplines.map(
      (discipline) => discipline.disciplineKey,
    )

  for (const disciplineKey of duplicateValues(
    disciplineKeys,
  )) {
    issues.push(
      issue(
        'CHARACTER_DISCIPLINE_DUPLICATE',
        'disciplines',
        'Una Disciplina no puede aparecer mas de una vez.',
        { disciplineKey },
      ),
    )
  }

  const learnedPowerKeys: string[] = []

  for (const discipline of character.disciplines) {
    if (
      !Number.isInteger(discipline.rating) ||
      discipline.rating < 1 ||
      discipline.rating > 5
    ) {
      issues.push(
        issue(
          'CHARACTER_DISCIPLINE_RATING_OUT_OF_RANGE',
          'disciplines',
          'La puntuacion de Disciplina debe estar entre 1 y 5.',
          {
            disciplineKey:
              discipline.disciplineKey,
            rating: discipline.rating,
          },
        ),
      )
    }

    if (
      discipline.powerKeys.length > discipline.rating
    ) {
      issues.push(
        issue(
          'CHARACTER_DISCIPLINE_POWER_CAPACITY_EXCEEDED',
          'disciplines',
          'Una Disciplina no puede registrar mas Poderes que su puntuacion.',
          {
            disciplineKey:
              discipline.disciplineKey,
            rating: discipline.rating,
            powerCount:
              discipline.powerKeys.length,
          },
        ),
      )
    }

    for (const powerKey of discipline.powerKeys) {
      if (powerKey.trim().length === 0) {
        issues.push(
          issue(
            'CHARACTER_DISCIPLINE_POWER_KEY_REQUIRED',
            'disciplines',
            'Cada Poder adquirido necesita un identificador.',
            {
              disciplineKey:
                discipline.disciplineKey,
            },
          ),
        )
      }

      learnedPowerKeys.push(powerKey)
    }
  }

  for (const powerKey of duplicateValues(
    learnedPowerKeys,
  )) {
    issues.push(
      issue(
        'CHARACTER_DISCIPLINE_POWER_DUPLICATE',
        'disciplines',
        'Un Poder adquirido no puede repetirse.',
        { powerKey },
      ),
    )
  }

  return issues
}

function disciplineRating(
  character: PersistedCharacterDraft,
  disciplineKey: string,
): number {
  return (
    character.disciplines.find(
      (discipline) =>
        discipline.disciplineKey === disciplineKey,
    )?.rating ?? 0
  )
}

function validateRelatedAcquisitions(
  character: PersistedCharacterDraft,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []
  const ritualKeys =
    character.bloodSorceryRituals.ritualKeys
  const ceremonyKeys =
    character.oblivionCeremonies.ceremonyKeys
  const formulaKeys =
    character.thinBloodAlchemy.formulaKeys

  for (const [code, field, values] of [
    [
      'CHARACTER_BLOOD_SORCERY_RITUAL_DUPLICATE',
      'bloodSorceryRituals',
      ritualKeys,
    ],
    [
      'CHARACTER_OBLIVION_CEREMONY_DUPLICATE',
      'oblivionCeremonies',
      ceremonyKeys,
    ],
    [
      'CHARACTER_THIN_BLOOD_FORMULA_DUPLICATE',
      'thinBloodAlchemy',
      formulaKeys,
    ],
  ] as const) {
    for (const definitionKey of duplicateValues(values)) {
      issues.push(
        issue(
          code,
          field,
          'Una adquisicion relacionada no puede repetirse.',
          { definitionKey },
        ),
      )
    }
  }

  if (
    ritualKeys.length > 0 &&
    disciplineRating(character, 'bloodSorcery') < 1
  ) {
    issues.push(
      issue(
        'CHARACTER_BLOOD_SORCERY_REQUIRED_FOR_RITUALS',
        'bloodSorceryRituals',
        'Los Rituales requieren Hechiceria de Sangre.',
      ),
    )
  }

  if (
    ceremonyKeys.length > 0 &&
    disciplineRating(character, 'oblivion') < 1
  ) {
    issues.push(
      issue(
        'CHARACTER_OBLIVION_REQUIRED_FOR_CEREMONIES',
        'oblivionCeremonies',
        'Las Ceremonias requieren Olvido.',
      ),
    )
  }

  const alchemy = character.thinBloodAlchemy

  if (
    !Number.isInteger(alchemy.rating) ||
    alchemy.rating < 0 ||
    alchemy.rating > 5
  ) {
    issues.push(
      issue(
        'CHARACTER_THIN_BLOOD_ALCHEMY_RATING_OUT_OF_RANGE',
        'thinBloodAlchemy',
        'La puntuacion de Alquimia debe estar entre 0 y 5.',
        { rating: alchemy.rating },
      ),
    )
  }

  if (
    alchemy.rating === 0 &&
    (alchemy.method !== null ||
      alchemy.formulaKeys.length > 0)
  ) {
    issues.push(
      issue(
        'CHARACTER_THIN_BLOOD_ALCHEMY_WITHOUT_RATING',
        'thinBloodAlchemy',
        'Alquimia 0 no puede conservar metodo ni formulas.',
      ),
    )
  }

  if (
    alchemy.rating > 0 &&
    alchemy.method === null
  ) {
    issues.push(
      issue(
        'CHARACTER_THIN_BLOOD_ALCHEMY_METHOD_REQUIRED',
        'thinBloodAlchemy',
        'Una puntuacion positiva de Alquimia requiere metodo.',
      ),
    )
  }

  return issues
}

function validatePersistedDisciplineState(
  character: PersistedCharacterDraft,
): CharacterSectionValidation {
  const issues = [
    ...validateDisciplines(character),
    ...validateRelatedAcquisitions(character),
  ]

  if (issues.length > 0) {
    return {
      section: 'disciplines',
      state: 'invalid',
      issues,
    }
  }

  return {
    section: 'disciplines',
    state: 'pending',
    issues: [
      {
        code:
          'CHARACTER_DISCIPLINE_CATALOG_VALIDATION_PENDING',
        severity: 'warning',
        section: 'disciplines',
        field: null,
        message:
          'Falta contrastar Disciplinas y Poderes con el catalogo canonico del backend.',
      },
    ],
  }
}

export const characterDisciplineValidationContributor:
  CharacterValidationContributor = {
  sections: ['disciplines'],

  validate(character) {
    return [
      validatePersistedDisciplineState(character),
    ]
  },
}
