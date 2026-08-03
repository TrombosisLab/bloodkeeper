import type {
  PersistedCharacterDraft,
  PersistedCharacterThinBloodTrait,
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
    section: 'dependencies',
    field,
    message,
    details,
  }
}

function hasPredatorTypeOrigin(
  character: PersistedCharacterDraft,
): boolean {
  return (
    character.disciplines.some(
      (discipline) =>
        discipline.origin === 'predatorType',
    ) ||
    character.skillSpecialties.some(
      (specialty) =>
        specialty.origin === 'predatorType',
    ) ||
    character.advantages.selections.some(
      (selection) =>
        selection.origin === 'predatorType',
    )
  )
}

function hasThinBloodOrigin(
  character: PersistedCharacterDraft,
): boolean {
  return (
    character.disciplines.some(
      (discipline) =>
        discipline.origin === 'thinBlood',
    ) ||
    character.advantages.selections.some(
      (selection) =>
        selection.origin === 'thinBlood',
    )
  )
}

function validateOrigins(
  character: PersistedCharacterDraft,
): CharacterValidationIssue[] {
  const issues: CharacterValidationIssue[] = []

  if (
    character.identity.predatorTypeKey === null &&
    hasPredatorTypeOrigin(character)
  ) {
    issues.push(
      issue(
        'CHARACTER_PREDATOR_TYPE_ORIGIN_WITHOUT_SELECTION',
        'identity.predatorTypeKey',
        'Hay efectos de Tipo de Depredador sin un Tipo seleccionado.',
      ),
    )
  }

  if (
    character.identity.clanKey !== 'thinBlood' &&
    hasThinBloodOrigin(character)
  ) {
    issues.push(
      issue(
        'CHARACTER_THIN_BLOOD_ORIGIN_NOT_ALLOWED',
        'identity.clanKey',
        'Solo Sangre Debil puede conservar efectos con este origen.',
      ),
    )
  }

  return issues
}

function duplicateTraitKeys(
  traits:
    readonly PersistedCharacterThinBloodTrait[],
): string[] {
  const seen = new Set<string>()
  const duplicated = new Set<string>()

  for (const trait of traits) {
    if (seen.has(trait.definitionKey)) {
      duplicated.add(trait.definitionKey)
    }
    seen.add(trait.definitionKey)
  }

  return [...duplicated]
}

function validateThinBloodOwnership(
  character: PersistedCharacterDraft,
): CharacterValidationIssue[] {
  if (character.identity.clanKey === 'thinBlood') {
    return []
  }

  const issues: CharacterValidationIssue[] = []

  if (character.thinBloodTraits.length > 0) {
    issues.push(
      issue(
        'CHARACTER_THIN_BLOOD_TRAITS_NOT_ALLOWED',
        'thinBloodTraits',
        'Solo Sangre Debil puede conservar Meritos y Defectos de Sangre Debil.',
      ),
    )
  }

  if (
    character.thinBloodAlchemy.rating > 0 ||
    character.thinBloodAlchemy.method !== null ||
    character.thinBloodAlchemy.formulaKeys.length > 0
  ) {
    issues.push(
      issue(
        'CHARACTER_THIN_BLOOD_ALCHEMY_NOT_ALLOWED',
        'thinBloodAlchemy',
        'Solo Sangre Debil puede conservar Alquimia de Sangre Debil.',
      ),
    )
  }

  return issues
}

function validateThinBloodTraitDetails(
  character: PersistedCharacterDraft,
): CharacterValidationIssue[] {
  if (character.identity.clanKey !== 'thinBlood') {
    return []
  }

  const issues: CharacterValidationIssue[] = []
  const traits = character.thinBloodTraits
  const selectedKeys = new Set(
    traits.map((trait) => trait.definitionKey),
  )

  for (const definitionKey of duplicateTraitKeys(traits)) {
    issues.push(
      issue(
        'CHARACTER_THIN_BLOOD_TRAIT_DUPLICATE',
        'thinBloodTraits',
        'Un Merito o Defecto de Sangre Debil no puede repetirse.',
        { definitionKey },
      ),
    )
  }

  for (const trait of traits) {
    const clanCurse = trait.clanCurseDetails
    const affinity = trait.disciplineAffinityDetails

    if (
      trait.definitionKey === 'clan-curse'
    ) {
      if (
        clanCurse === null ||
        clanCurse.clanKey.trim().length === 0
      ) {
        issues.push(
          issue(
            'CHARACTER_THIN_BLOOD_CLAN_CURSE_REQUIRED',
            'thinBloodTraits',
            'Maldicion de Clan necesita seleccionar un clan.',
          ),
        )
      }

      if (affinity !== null) {
        issues.push(
          issue(
            'CHARACTER_THIN_BLOOD_TRAIT_DETAILS_CONFLICT',
            'thinBloodTraits',
            'Maldicion de Clan no puede contener una Disciplina Afin.',
          ),
        )
      }

      if (
        clanCurse?.clanKey === 'brujah' ||
        clanCurse?.clanKey === 'gangrel'
      ) {
        if (!selectedKeys.has('bestial-temper')) {
          issues.push(
            issue(
              'CHARACTER_THIN_BLOOD_BESTIAL_TEMPER_REQUIRED',
              'thinBloodTraits',
              'Esta Maldicion de Clan requiere Temperamento Bestial.',
            ),
          )
        }
      }

      if (
        clanCurse?.clanKey === 'tremere' &&
        !selectedKeys.has('bonding-blood')
      ) {
        issues.push(
          issue(
            'CHARACTER_THIN_BLOOD_BONDING_BLOOD_REQUIRED',
            'thinBloodTraits',
            'La Maldicion Tremere requiere Sangre Vinculante.',
          ),
        )
      }

      continue
    }

    if (clanCurse !== null) {
      issues.push(
        issue(
          'CHARACTER_THIN_BLOOD_CLAN_CURSE_DETAILS_NOT_ALLOWED',
          'thinBloodTraits',
          'Solo Maldicion de Clan puede contener esos detalles.',
          { definitionKey: trait.definitionKey },
        ),
      )
    }

    if (
      trait.definitionKey === 'discipline-affinity'
    ) {
      if (
        affinity === null ||
        affinity.powerKey.trim().length === 0
      ) {
        issues.push(
          issue(
            'CHARACTER_THIN_BLOOD_DISCIPLINE_AFFINITY_REQUIRED',
            'thinBloodTraits',
            'Disciplina Afin necesita una Disciplina y un Poder.',
          ),
        )
      }
    } else if (affinity !== null) {
      issues.push(
        issue(
          'CHARACTER_THIN_BLOOD_DISCIPLINE_AFFINITY_DETAILS_NOT_ALLOWED',
          'thinBloodTraits',
          'Solo Disciplina Afin puede contener esos detalles.',
          { definitionKey: trait.definitionKey },
        ),
      )
    }
  }

  return issues
}

function validatePersistedDependencies(
  character: PersistedCharacterDraft,
): CharacterSectionValidation {
  const issues = [
    ...validateOrigins(character),
    ...validateThinBloodOwnership(character),
    ...validateThinBloodTraitDetails(character),
  ]

  if (issues.length > 0) {
    return {
      section: 'dependencies',
      state: 'invalid',
      issues,
    }
  }

  return {
    section: 'dependencies',
    state: 'pending',
    issues: [
      {
        code:
          'CHARACTER_CATALOG_DEPENDENCY_VALIDATION_PENDING',
        severity: 'warning',
        section: 'dependencies',
        field: null,
        message:
          'Falta contrastar efectos y requisitos cruzados con los catalogos canonicos del backend.',
      },
    ],
  }
}

export const characterDependencyValidationContributor:
  CharacterValidationContributor = {
  sections: ['dependencies'],

  validate(character) {
    return [validatePersistedDependencies(character)]
  },
}
