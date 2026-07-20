import type {
  CharacterSkillsDraft,
  SkillKey,
  SkillSpecialty,
} from '../types/character-skills-draft.types'

export interface SpecialtyValidationResult {
  valid: boolean
  errors: string[]
}

export function canAddSpecialty(
  skills: CharacterSkillsDraft,
  skillKey: SkillKey,
): boolean {
  return skills[skillKey] > 0
}

export function normalizeSpecialtyName(
  name: string,
): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function addSpecialty(
  specialties: SkillSpecialty[],
  skills: CharacterSkillsDraft,
  skillKey: SkillKey,
  name: string,
  id: string,
): SkillSpecialty[] {
  const normalized =
    normalizeSpecialtyName(name)

  if (!normalized) {
    return specialties
  }

  if (!canAddSpecialty(skills, skillKey)) {
    return specialties
  }

  const duplicate =
    specialties.some(
      (specialty) =>
        specialty.skillKey === skillKey &&
        specialty.name.toLocaleLowerCase() ===
          normalized.toLocaleLowerCase(),
    )

  if (duplicate) {
    return specialties
  }

  return [
    ...specialties,
    {
      id,
      skillKey,
      name: normalized,
    },
  ]
}

export function removeSpecialty(
  specialties: SkillSpecialty[],
  id: string,
): SkillSpecialty[] {
  return specialties.filter(
    (specialty) =>
      specialty.id !== id,
  )
}

export function removeInvalidSpecialties(
  specialties: SkillSpecialty[],
  skills: CharacterSkillsDraft,
): SkillSpecialty[] {
  return specialties.filter(
    (specialty) =>
      canAddSpecialty(
        skills,
        specialty.skillKey,
      ),
  )
}

export function validateSpecialties(
  specialties: SkillSpecialty[],
  skills: CharacterSkillsDraft,
): SpecialtyValidationResult {
  const errors: string[] = []

  for (const specialty of specialties) {
    if (
      !normalizeSpecialtyName(
        specialty.name,
      )
    ) {
      errors.push(
        'Las especialidades no pueden estar vacías.',
      )
    }

    if (
      !canAddSpecialty(
        skills,
        specialty.skillKey,
      )
    ) {
      errors.push(
        'No puede existir una especialidad en una habilidad con valor 0.',
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
  }
}
