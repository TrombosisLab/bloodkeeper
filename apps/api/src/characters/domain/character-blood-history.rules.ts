import {
  characterBloodDyscrasiaCatalog,
  characterBloodResonanceCatalog,
  characterDisciplineCatalog,
} from '@v5r/character-rules'

import type {
  CharacterRulesDisciplineKey,
} from '@v5r/character-rules'

import type {
  ApplyCharacterBloodResonanceData,
  CharacterBloodDyscrasiaKey,
} from './character-blood-resonance.types'

export const CHARACTER_BLOOD_FEEDING_HISTORY_TITLE =
  'Alimentación y Resonancia'

export const CHARACTER_BLOOD_DYSCRASIA_CONSUMPTION_HISTORY_TITLE =
  'Discrasia consumida'

export interface CharacterBloodHistoryText {
  readonly title: string
  readonly description: string
}

interface NamedDefinition {
  readonly key: string
  readonly name: string
}

function nameOf(
  definitions: readonly NamedDefinition[],
  key: string | null,
  fallback: string,
): string {
  if (key === null) return fallback

  return (
    definitions.find(
      (definition) =>
        definition.key === key,
    )?.name ?? fallback
  )
}

type FeedingHistoryInput = Pick<
  ApplyCharacterBloodResonanceData,
  | 'sourceKind'
  | 'resonanceKey'
  | 'specialAffinityKey'
  | 'temperament'
  | 'dyscrasiaKey'
>

export function buildCharacterBloodFeedingHistoryEntry(
  data: FeedingHistoryInput,
): CharacterBloodHistoryText {
  const temperamentName =
    nameOf(
      characterBloodResonanceCatalog.temperaments,
      data.temperament,
      data.temperament ?? '',
    )

  let description: string

  if (data.resonanceKey !== null) {
    const resonanceName =
      nameOf(
        characterBloodResonanceCatalog.resonances,
        data.resonanceKey,
        data.resonanceKey,
      )

    const source =
      data.sourceKind === 'animal'
        ? 'sangre animal con Resonancia'
        : 'sangre con Resonancia'

    description =
      `El personaje se ha alimentado de ${source} ${resonanceName}` +
      (temperamentName.length === 0
        ? ''
        : ` (${temperamentName})`) +
      '.'
  } else if (
    data.specialAffinityKey !== null
  ) {
    const affinityName =
      nameOf(
        characterBloodResonanceCatalog
          .specialAffinities,
        data.specialAffinityKey,
        data.specialAffinityKey,
      )

    if (
      data.specialAffinityKey ===
        'resonanceFree'
    ) {
      description =
        'El personaje se ha alimentado con sangre libre de Resonancia.'
    } else {
      description =
        `El personaje se ha alimentado y ha adquirido la afinidad ${affinityName}` +
        (temperamentName.length === 0
          ? ''
          : ` (${temperamentName})`) +
        '.'
    }
  } else {
    description =
      'El personaje se ha alimentado sin conservar una Resonancia mecánicamente significativa.'
  }

  if (data.dyscrasiaKey !== null) {
    const dyscrasiaName =
      nameOf(
        characterBloodDyscrasiaCatalog.definitions,
        data.dyscrasiaKey,
        data.dyscrasiaKey,
      )

    description +=
      ` Ha obtenido la Discrasia ${dyscrasiaName}.`
  }

  return Object.freeze({
    title:
      CHARACTER_BLOOD_FEEDING_HISTORY_TITLE,
    description,
  })
}

export function buildCharacterBloodDyscrasiaConsumptionHistoryEntry(
  data: {
    readonly dyscrasiaKey:
      CharacterBloodDyscrasiaKey
    readonly disciplineKey?:
      CharacterRulesDisciplineKey | null
  },
): CharacterBloodHistoryText {
  const dyscrasiaName =
    nameOf(
      characterBloodDyscrasiaCatalog.definitions,
      data.dyscrasiaKey,
      data.dyscrasiaKey,
    )

  let description =
    `El personaje ha consumido la Discrasia ${dyscrasiaName}.`

  if (
    data.disciplineKey !== undefined &&
    data.disciplineKey !== null
  ) {
    const disciplineName =
      nameOf(
        characterDisciplineCatalog.disciplines,
        data.disciplineKey,
        data.disciplineKey,
      )

    description =
      `El personaje ha consumido la Discrasia ${dyscrasiaName} ` +
      `al aplicarla a la adquisición de ${disciplineName}.`
  }

  return Object.freeze({
    title:
      CHARACTER_BLOOD_DYSCRASIA_CONSUMPTION_HISTORY_TITLE,
    description,
  })
}
