import {
  attributeDefinitions,
} from '../../character-creation/data/attribute-definitions.ts'

import {
  characterAdvantageDefinitions,
} from '../../character-creation/data/character-advantage-definitions.ts'

import {
  getClanDefinition,
} from '../../character-creation/data/clan-definitions.ts'

import {
  contentSources,
} from '../../character-creation/data/content-sources.ts'

import {
  disciplineDefinitions,
} from '../../character-creation/data/discipline-definitions.ts'

import {
  disciplinePowerDefinitions,
} from '../../character-creation/data/discipline-power-definitions.ts'

import {
  skillDefinitions,
} from '../../character-creation/data/skill-definitions.ts'

import {
  getPredatorType,
} from '../../character-creation/domain/predator-type-rules.ts'

import {
  deriveCharacterTraits,
} from '../../character-creation/domain/blood-rules.ts'

import type {
  CharacterDraftApiSnapshot,
} from '../../character-creation/types/character-draft-api.types.ts'

import type {
  CharacterAdvantageSelectionDraft,
} from '../../character-creation/types/character-advantages-draft.types.ts'

import type {
  ClanKey,
} from '../../character-creation/types/clan.types.ts'

import type {
  CharacterDisciplineState,
} from '../types/character-disciplines.types.ts'

import type {
  CharacterSheetModel,
} from '../types/character-sheet-model.types.ts'

import {
  buildCharacterAdvantageReadModel,
} from './character-advantage-read-model.ts'

import {
  buildCharacterDisciplineReadModel,
} from './character-discipline-read-model.ts'

const categoryOrder = [
  'physical',
  'social',
  'mental',
] as const

const categoryLabels:
  Readonly<Record<
    typeof categoryOrder[number],
    string
  >> = {
    physical: 'Físicos',
    social: 'Sociales',
    mental: 'Mentales',
  }

function optionalText(
  value: string | null,
): string {
  return value ?? ''
}

function clanLabel(
  clanKey: string | null,
): string {
  if (clanKey === null) return ''

  try {
    return getClanDefinition(
      clanKey as ClanKey,
    ).name
  } catch {
    return clanKey
  }
}

function predatorTypeLabel(
  predatorTypeKey: string | null,
): string {
  if (predatorTypeKey === null) return ''

  return (
    getPredatorType(predatorTypeKey)?.name ??
    predatorTypeKey
  )
}

function generationLabel(
  generation: number | null,
): string {
  return generation === null
    ? ''
    : `${generation}ª`
}

function buildAttributes(
  snapshot: CharacterDraftApiSnapshot,
): CharacterSheetModel['attributes'] {
  return categoryOrder.map(
    (category) => ({
      key: category,
      label: categoryLabels[category],
      attributes:
        attributeDefinitions
          .filter(
            (definition) =>
              definition.category === category,
          )
          .map(
            (definition) => ({
              key: definition.key,
              label: definition.label,
              value:
                snapshot.attributes[
                  definition.key
                ],
            }),
          ),
    }),
  )
}

function buildSkills(
  snapshot: CharacterDraftApiSnapshot,
): CharacterSheetModel['skills'] {
  const specialtiesBySkill =
    new Map<string, string[]>()

  for (
    const specialty of
      snapshot.skillSpecialties
  ) {
    const specialties =
      specialtiesBySkill.get(
        specialty.skillKey,
      ) ?? []

    specialties.push(specialty.name)

    specialtiesBySkill.set(
      specialty.skillKey,
      specialties,
    )
  }

  return categoryOrder.map(
    (category) => ({
      key: category,
      label: categoryLabels[category],
      skills:
        skillDefinitions
          .filter(
            (definition) =>
              definition.category === category,
          )
          .map(
            (definition) => {
              const specialties =
                specialtiesBySkill.get(
                  definition.key,
                ) ?? []

              return {
                key: definition.key,
                label: definition.label,
                value:
                  snapshot.skills[
                    definition.key
                  ],
                ...(specialties.length === 0
                  ? {}
                  : {
                      specialties: [
                        ...specialties,
                      ],
                    }),
              }
            },
          ),
    }),
  )
}

function aggregateDisciplines(
  snapshot: CharacterDraftApiSnapshot,
): CharacterDisciplineState[] {
  const aggregate =
    new Map<
      string,
      {
        key: string
        value: number
        powerKeys: string[]
      }
    >()

  for (
    const contribution of
      snapshot.disciplines
  ) {
    const current =
      aggregate.get(
        contribution.disciplineKey,
      ) ?? {
        key:
          contribution.disciplineKey,
        value: 0,
        powerKeys: [],
      }

    current.value +=
      contribution.rating

    for (
      const powerKey of
        contribution.powerKeys
    ) {
      if (
        !current.powerKeys.includes(
          powerKey,
        )
      ) {
        current.powerKeys.push(powerKey)
      }
    }

    aggregate.set(
      contribution.disciplineKey,
      current,
    )
  }

  return Array.from(
    aggregate.values(),
  )
}

function advantageSelections(
  snapshot: CharacterDraftApiSnapshot,
): CharacterAdvantageSelectionDraft[] {
  return snapshot.advantages.selections.map(
    (selection) => ({
      selectionId:
        selection.selectionId,
      definitionKey:
        selection.definitionKey,
      category:
        selection.category,
      rating:
        selection.rating,
      origin:
        selection.origin,
      ...(selection.parentSelectionId ===
      null
        ? {}
        : {
            parentSelectionId:
              selection.parentSelectionId,
          }),
      ...(selection.details === null
        ? {}
        : {
            details:
              structuredClone(
                selection.details,
              ),
          }),
    }),
  )
}

function requireVampireBlood(
  snapshot: CharacterDraftApiSnapshot,
): NonNullable<CharacterDraftApiSnapshot['blood']> {
  if (snapshot.blood === null) {
    throw new Error(
      'CHARACTER_SHEET_VAMPIRE_BLOOD_REQUIRED',
    )
  }

  return snapshot.blood
}

export function adaptPersistedCharacterToSheetModel(
  snapshot: CharacterDraftApiSnapshot,
): CharacterSheetModel {
  const derived =
    deriveCharacterTraits(
      snapshot.attributes,
    )

  const disciplines =
    buildCharacterDisciplineReadModel(
      aggregateDisciplines(snapshot),
      disciplineDefinitions,
      disciplinePowerDefinitions,
      contentSources,
    )

  const advantages =
    buildCharacterAdvantageReadModel(
      advantageSelections(snapshot),
      characterAdvantageDefinitions,
    )

  return {
    characterId:
      snapshot.characterId,
    revision:
      snapshot.revision,
    status:
      snapshot.status,
    chronicleId:
      snapshot.chronicleId,

    identity: {
      name:
        snapshot.identity.name,
      concept:
        optionalText(
          snapshot.identity.concept,
        ),
      predatorType:
        predatorTypeLabel(
          snapshot.identity
            .predatorTypeKey,
        ),
      /*
       * No se presenta el UUID como nombre de Crónica.
       * Queda vacío hasta disponer de su catálogo persistido.
       */
      chronicle: '',
      ambition:
        optionalText(
          snapshot.identity.ambition,
        ),
      clan:
        clanLabel(
          snapshot.identity.clanKey,
        ),
      sire:
        optionalText(
          snapshot.identity.sire,
        ),
      desire:
        optionalText(
          snapshot.identity.desire,
        ),
      generation:
        generationLabel(
          snapshot.identity.generation,
        ),
    },

    attributes:
      buildAttributes(snapshot),

    skills:
      buildSkills(snapshot),

    state: {
      humanity: {
        value:
          snapshot.humanity.value,
        stains:
          snapshot.humanity.stains,
      },
      hunger:
        requireVampireBlood(snapshot).hunger,
      bloodPotency:
        requireVampireBlood(snapshot)
          .bloodPotency,
    },

    damage: {
      health: {
        ...snapshot.damage.health,
      },
      healthCapacity:
        derived.health,
      willpower: {
        ...snapshot.damage.willpower,
      },
      willpowerCapacity:
        derived.willpower,
    },

    disciplines,
    advantages,

    narrative: {
      convictions:
        snapshot.humanity.convictions.map(
          (conviction) => ({
            key:
              conviction.convictionId,
            text:
              conviction.text,
          }),
        ),
      touchstones:
        snapshot.humanity.touchstones.map(
          (touchstone) => ({
            key:
              touchstone.touchstoneId,
            name:
              touchstone.name,
            relation:
              touchstone.relationship,
          }),
        ),
      notes: '',
    },

    availability: {
      chronicleName: false,
      bloodExperience: true,
    },
  }
}
