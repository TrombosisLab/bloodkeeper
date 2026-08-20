import {
  characterBloodResonanceCatalog,
  characterDisciplineCatalog,
  deriveCharacterBloodResonanceBaseDiceBonus,
} from '@v5r/character-rules'

import type {
  CharacterRulesDisciplineKey,
} from '@v5r/character-rules'

import type {
  PersistedCharacterBloodResonance,
} from '../../characters/domain/persisted-character.types'

import type {
  DicePoolModifier,
} from './dice-pool.types'

export const CHARACTER_BLOOD_RESONANCE_DICE_MODIFIER_KEY =
  'bloodResonance'

function disciplineName(
  disciplineKey: CharacterRulesDisciplineKey,
): string {
  return (
    characterDisciplineCatalog.disciplines.find(
      ({ key }) => key === disciplineKey,
    )?.name ?? disciplineKey
  )
}

function temperamentName(
  temperament:
    PersistedCharacterBloodResonance['temperament'],
): string | null {
  if (temperament === null) return null

  return (
    characterBloodResonanceCatalog.temperaments.find(
      ({ key }) => key === temperament,
    )?.name ?? temperament
  )
}

export function deriveCharacterBloodResonanceDiceModifier(
  resonance:
    PersistedCharacterBloodResonance | null,
  disciplineKey:
    CharacterRulesDisciplineKey | null,
): DicePoolModifier | null {
  if (
    resonance === null ||
    disciplineKey === null
  ) {
    return null
  }

  let sourceName: string
  let associatedDisciplines:
    readonly CharacterRulesDisciplineKey[]
  let usesTemperamentDiceBonus = true

  if (resonance.resonanceKey !== null) {
    const definition =
      characterBloodResonanceCatalog.resonances.find(
        ({ key }) =>
          key === resonance.resonanceKey,
      )

    if (definition === undefined) {
      return null
    }

    sourceName = definition.name
    associatedDisciplines =
      definition.disciplineKeys
  } else if (
    resonance.specialAffinityKey !== null
  ) {
    const definition =
      characterBloodResonanceCatalog
        .specialAffinities
        .find(
          ({ key }) =>
            key ===
            resonance.specialAffinityKey,
        )

    if (definition === undefined) {
      return null
    }

    sourceName = definition.name
    associatedDisciplines =
      definition.disciplineKeys
    usesTemperamentDiceBonus =
      definition.usesTemperamentDiceBonus
  } else {
    return null
  }

  if (
    !associatedDisciplines.includes(
      disciplineKey,
    ) ||
    !usesTemperamentDiceBonus ||
    resonance.temperament === null
  ) {
    return null
  }

  const value =
    deriveCharacterBloodResonanceBaseDiceBonus(
      resonance.temperament,
    )

  if (value === 0) {
    return null
  }

  const temperament =
    temperamentName(resonance.temperament)

  return Object.freeze({
    key:
      CHARACTER_BLOOD_RESONANCE_DICE_MODIFIER_KEY,
    label:
      `Resonancia: ${sourceName}` +
      (temperament === null
        ? ''
        : ` · ${temperament}`) +
      ` · ${disciplineName(disciplineKey)}`,
    value,
  })
}
