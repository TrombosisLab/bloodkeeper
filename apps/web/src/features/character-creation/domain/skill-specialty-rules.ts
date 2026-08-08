import {
  skillDefinitions,
} from '../data/skill-definitions.ts'

import type {
  CharacterSkillsDraft,
  SkillKey,
  SkillSpecialty,
} from '../types/character-skills-draft.types'

export const creationSpecialtySkillKeys = [
  'academics',
  'craft',
  'performance',
  'science',
] as const satisfies readonly SkillKey[]

function skillLabel(
  skillKey: SkillKey,
): string {
  return (
    skillDefinitions.find(
      (definition) =>
        definition.key === skillKey,
    )?.label ?? skillKey
  )
}

export interface SpecialtyValidationResult {
  valid: boolean
  errors: string[]
}

export interface SpecialtyCreationBudget {
  required: number
  selected: number
  remaining: number
  exceeded: number
  mandatorySkillKeys: SkillKey[]
  missingMandatorySkillKeys: SkillKey[]
  complete: boolean
}

export function isCreationSpecialty(
  specialty: SkillSpecialty,
): boolean {
  return specialty.origin !== 'predatorType'
}

export function getSpecialtyCreationBudget(
  specialties: SkillSpecialty[],
  skills: CharacterSkillsDraft,
): SpecialtyCreationBudget {
  const mandatorySkillKeys =
    creationSpecialtySkillKeys.filter(
      (skillKey) => skills[skillKey] > 0,
    )

  const creationSpecialties =
    specialties.filter(isCreationSpecialty)

  const missingMandatorySkillKeys =
    mandatorySkillKeys.filter(
      (skillKey) =>
        !creationSpecialties.some(
          (specialty) =>
            specialty.skillKey === skillKey,
        ),
    )

  const required =
    1 + mandatorySkillKeys.length

  const selected =
    creationSpecialties.length

  return {
    required,
    selected,
    remaining:
      Math.max(0, required - selected),
    exceeded:
      Math.max(0, selected - required),
    mandatorySkillKeys: [...mandatorySkillKeys],
    missingMandatorySkillKeys: [
      ...missingMandatorySkillKeys,
    ],
    complete:
      selected === required &&
      missingMandatorySkillKeys.length === 0,
  }
}

export function canAddSpecialty(
  skills: CharacterSkillsDraft,
  skillKey: SkillKey,
): boolean {
  return skills[skillKey] > 0
}

export function canAddCreationSpecialty(
  specialties: SkillSpecialty[],
  skills: CharacterSkillsDraft,
  skillKey: SkillKey,
): boolean {
  const budget =
    getSpecialtyCreationBudget(
      specialties,
      skills,
    )

  return (
    canAddSpecialty(skills, skillKey) &&
    budget.selected < budget.required
  )
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

  if (
    !canAddCreationSpecialty(
      specialties,
      skills,
      skillKey,
    )
  ) {
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
      origin: 'creation',
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
  requireCompleteCreation = false,
): SpecialtyValidationResult {
  const errors: string[] = []
  const identities = new Set<string>()

  for (const specialty of specialties) {
    const normalized =
      normalizeSpecialtyName(
        specialty.name,
      )

    if (!normalized) {
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

    const identity = [
      specialty.skillKey,
      normalized.toLocaleLowerCase(),
    ].join(':')

    if (identities.has(identity)) {
      errors.push(
        'No puede repetirse una especialidad en la misma habilidad.',
      )
    }

    identities.add(identity)
  }

  const budget =
    getSpecialtyCreationBudget(
      specialties,
      skills,
    )

  if (budget.exceeded > 0) {
    errors.push(
      `La creación permite exactamente ${budget.required} especialidades propias con este reparto de Habilidades.`,
    )
  }

  if (
    requireCompleteCreation &&
    budget.selected < budget.required
  ) {
    errors.push(
      `Debes seleccionar ${budget.required} especialidades de creación con este reparto de Habilidades.`,
    )
  }

  if (
    requireCompleteCreation &&
    budget.missingMandatorySkillKeys.length > 0
  ) {
    const labels =
      budget.missingMandatorySkillKeys.map(
        skillLabel,
      )

    errors.push(
      `Falta una especialidad obligatoria en: ${labels.join(', ')}.`,
    )
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
  }
}
