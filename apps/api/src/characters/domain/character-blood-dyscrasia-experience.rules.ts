import {
  characterBloodDyscrasiaCatalog,
} from '@v5r/character-rules'

import type {
  CharacterRulesBloodDyscrasiaKey,
  CharacterRulesDisciplineKey,
} from '@v5r/character-rules'

import type {
  CharacterAdvancementDyscrasiaExperienceBenefit,
  CharacterAdvancementPreview,
  CharacterAdvancementRequest,
} from './character-advancement.types'

export const CHARACTER_DYSCRASIA_EXPERIENCE_UNAVAILABLE =
  'DYSCRASIA_EXPERIENCE_UNAVAILABLE'

export type CharacterBloodDyscrasiaExperienceAssessment =
  | {
      readonly status: 'notRequested'
      readonly benefit: null
      readonly message: null
    }
  | {
      readonly status: 'available'
      readonly benefit:
        CharacterAdvancementDyscrasiaExperienceBenefit
      readonly message: null
    }
  | {
      readonly status: 'unavailable'
      readonly benefit: null
      readonly message: string
    }

function unavailable(
  message: string,
): CharacterBloodDyscrasiaExperienceAssessment {
  return {
    status: 'unavailable',
    benefit: null,
    message,
  }
}

function restrictedDefinition(
  dyscrasiaKey:
    CharacterRulesBloodDyscrasiaKey,
) {
  const definition =
    characterBloodDyscrasiaCatalog
      .definitions
      .find(
        ({ key }) =>
          key === dyscrasiaKey,
      )

  if (
    definition === undefined ||
    definition.consumable !== true ||
    definition.effect.kind !==
      'restrictedExperienceGrant'
  ) {
    return null
  }

  const amount =
    definition.effect.amount

  const disciplineKeys =
    definition.effect.disciplineKeys

  if (
    amount !== 1 ||
    !Array.isArray(disciplineKeys)
  ) {
    return null
  }

  return {
    amount: 1 as const,
    disciplineKeys:
      disciplineKeys as readonly string[],
  }
}

export function assessCharacterBloodDyscrasiaExperience(
  activeDyscrasiaKey:
    CharacterRulesBloodDyscrasiaKey | null,
  request:
    CharacterAdvancementRequest,
  requested: boolean,
): CharacterBloodDyscrasiaExperienceAssessment {
  if (!requested) {
    return {
      status: 'notRequested',
      benefit: null,
      message: null,
    }
  }

  if (
    request.kind !== 'discipline'
  ) {
    return unavailable(
      'El punto de Experiencia de Discrasia sólo puede aplicarse a una compra de Disciplina.',
    )
  }

  if (
    activeDyscrasiaKey === null
  ) {
    return unavailable(
      'No existe una Discrasia activa que conceda Experiencia restringida.',
    )
  }

  const definition =
    restrictedDefinition(
      activeDyscrasiaKey,
    )

  if (definition === null) {
    return unavailable(
      'La Discrasia activa no concede un punto de Experiencia consumible.',
    )
  }

  if (
    !definition.disciplineKeys.includes(
      request.disciplineKey,
    )
  ) {
    return unavailable(
      'La Discrasia activa no puede aplicarse a la Disciplina seleccionada.',
    )
  }

  const disciplineKey =
    request.disciplineKey as
      CharacterRulesDisciplineKey

  return {
    status: 'available',
    benefit: {
      dyscrasiaKey:
        activeDyscrasiaKey,
      disciplineKey,
      amount: 1,
    },
    message: null,
  }
}

export function applyCharacterBloodDyscrasiaExperiencePreview(
  preview:
    CharacterAdvancementPreview,
  actualAvailable: number,
  benefit:
    CharacterAdvancementDyscrasiaExperienceBenefit,
): CharacterAdvancementPreview {
  if (preview.cost === null) {
    return preview
  }

  const effectiveCost =
    preview.cost - benefit.amount

  if (effectiveCost < 0) {
    return {
      ...preview,
      available: actualAvailable,
      eligible: false,
      issues: [
        ...preview.issues,
        {
          code:
            CHARACTER_DYSCRASIA_EXPERIENCE_UNAVAILABLE,
          message:
            'El descuento de Discrasia produciría un coste inválido.',
        },
      ],
    }
  }

  return {
    ...preview,
    cost: effectiveCost,
    available: actualAvailable,
    eligible:
      preview.eligible &&
      actualAvailable >= effectiveCost,
    consequences: [
      ...preview.consequences,
      (
        `dyscrasia_experience:${benefit.dyscrasiaKey}` +
        `:${benefit.disciplineKey}:-${benefit.amount}`
      ),
    ],
  }
}

export function rejectCharacterBloodDyscrasiaExperiencePreview(
  preview:
    CharacterAdvancementPreview,
  message: string,
): CharacterAdvancementPreview {
  if (
    preview.issues.some(
      ({ code }) =>
        code ===
        CHARACTER_DYSCRASIA_EXPERIENCE_UNAVAILABLE,
    )
  ) {
    return {
      ...preview,
      eligible: false,
    }
  }

  return {
    ...preview,
    eligible: false,
    issues: [
      ...preview.issues,
      {
        code:
          CHARACTER_DYSCRASIA_EXPERIENCE_UNAVAILABLE,
        message,
      },
    ],
  }
}

export function isCharacterBloodDyscrasiaExperienceBenefit(
  benefit:
    CharacterAdvancementDyscrasiaExperienceBenefit,
): boolean {
  const definition =
    restrictedDefinition(
      benefit.dyscrasiaKey,
    )

  return (
    definition !== null &&
    benefit.amount ===
      definition.amount &&
    definition.disciplineKeys.includes(
      benefit.disciplineKey,
    )
  )
}
