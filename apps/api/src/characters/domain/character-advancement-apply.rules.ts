import type {
  CharacterRulesCatalog,
} from './character-rules-catalog'
import type {
  CharacterAdvancementPurchaseMutation,
  CharacterAdvancementRequest,
} from './character-advancement.types'
import type {
  CharacterAttributeKey,
  CharacterDisciplineKey,
  CharacterSkillKey,
  PersistedCharacterDraft,
} from './persisted-character.types'

export function normalizeCharacterAdvancementMutation(
  character: PersistedCharacterDraft,
  request: CharacterAdvancementRequest,
  acquisitionId: string,
  catalog: CharacterRulesCatalog,
): CharacterAdvancementPurchaseMutation {
  if (request.kind !== 'advantage') return request

  const definition = catalog.advantageCatalog.definitions.find(
    ({ key }) => key === request.definitionKey,
  )
  if (definition === undefined) {
    throw new Error('Cannot normalize an unknown Advantage')
  }

  const existing = request.selectionId === null
    ? null
    : character.advantages.selections.find(
        ({ selectionId }) => selectionId === request.selectionId,
      ) ?? null

  return {
    kind: 'advantage',
    definitionKey: request.definitionKey,
    selectionId: request.selectionId ?? acquisitionId,
    create: existing === null,
    targetRating: request.targetRating,
    category: definition.category,
    parentSelectionId: request.parentSelectionId === undefined
      ? existing?.parentSelectionId ?? null
      : request.parentSelectionId,
    details: request.details === undefined
      ? existing?.details ?? null
      : request.details,
  }
}

export function characterAdvancementAcquisitionKey(
  mutation: CharacterAdvancementPurchaseMutation,
): string {
  switch (mutation.kind) {
    case 'attribute':
    case 'skill':
    case 'ritual':
    case 'formula':
    case 'ceremony': return mutation.key
    case 'specialty': return `${mutation.skillKey}:${mutation.name}`
    case 'discipline': return `${mutation.disciplineKey}:${mutation.powerKey}`
    case 'advantage': return `${mutation.definitionKey}:${mutation.selectionId}`
    case 'bloodPotency': return 'bloodPotency'
  }
}

export function applyCharacterAdvancement(
  character: PersistedCharacterDraft,
  mutation: CharacterAdvancementPurchaseMutation,
  acquisitionId: string,
): PersistedCharacterDraft {
  const base = {
    ...character,
    revision: character.revision + 1,
  }

  if (mutation.kind === 'attribute') {
    const key = mutation.key as CharacterAttributeKey
    return {
      ...base,
      attributes: {
        ...character.attributes,
        [key]: character.attributes[key] + 1,
      },
    }
  }

  if (mutation.kind === 'skill') {
    const key = mutation.key as CharacterSkillKey
    return {
      ...base,
      skills: {
        ...character.skills,
        [key]: character.skills[key] + 1,
      },
    }
  }

  if (mutation.kind === 'specialty') {
    return {
      ...base,
      skillSpecialties: [
        ...character.skillSpecialties,
        {
          id: acquisitionId,
          skillKey: mutation.skillKey as CharacterSkillKey,
          name: mutation.name,
          origin: 'evolution',
        },
      ],
    }
  }

  if (mutation.kind === 'discipline') {
    const existingEvolution = character.disciplines.find(
      ({ disciplineKey, origin }) =>
        disciplineKey === mutation.disciplineKey && origin === 'evolution',
    )
    return {
      ...base,
      disciplines: existingEvolution === undefined
        ? [
            ...character.disciplines,
            {
              disciplineKey: mutation.disciplineKey as CharacterDisciplineKey,
              rating: 1,
              powerKeys: [mutation.powerKey],
              origin: 'evolution',
            },
          ]
        : character.disciplines.map((discipline) =>
            discipline === existingEvolution
              ? {
                  ...discipline,
                  rating: discipline.rating + 1,
                  powerKeys: [...discipline.powerKeys, mutation.powerKey],
                }
              : discipline,
          ),
    }
  }

  if (mutation.kind === 'ritual') {
    return {
      ...base,
      bloodSorceryRituals: {
        ritualKeys: [...character.bloodSorceryRituals.ritualKeys, mutation.key],
      },
    }
  }

  if (mutation.kind === 'formula') {
    return {
      ...base,
      thinBloodAlchemy: {
        ...character.thinBloodAlchemy,
        formulaKeys: [...character.thinBloodAlchemy.formulaKeys, mutation.key],
      },
    }
  }

  if (mutation.kind === 'ceremony') {
    return {
      ...base,
      oblivionCeremonies: {
        ceremonyKeys: [...character.oblivionCeremonies.ceremonyKeys, mutation.key],
      },
    }
  }

  if (mutation.kind === 'advantage') {
    const selections = mutation.create
      ? [
          ...character.advantages.selections,
          {
            selectionId: mutation.selectionId,
            definitionKey: mutation.definitionKey,
            category: mutation.category,
            rating: mutation.targetRating,
            origin: 'evolution' as const,
            parentSelectionId: mutation.parentSelectionId,
            details: mutation.details,
          },
        ]
      : character.advantages.selections.map((selection) =>
          selection.selectionId === mutation.selectionId
            ? {
                ...selection,
                rating: mutation.targetRating,
                parentSelectionId: mutation.parentSelectionId,
                details: mutation.details,
              }
            : selection,
        )
    return { ...base, advantages: { selections } }
  }

  return {
    ...base,
    blood: {
      ...character.blood,
      bloodPotency: character.blood.bloodPotency + 1,
    },
  }
}
