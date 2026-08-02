import type {
  PersistedCharacterAttributes,
  PersistedCharacterDraft,
  PersistedCharacterSkills,
} from './persisted-character.types'

export interface CharacterAttributeSkillRatings {
  readonly characterId: string
  readonly revision: number
  readonly attributes:
    Readonly<PersistedCharacterAttributes>
  readonly skills:
    Readonly<PersistedCharacterSkills>
}

export function toCharacterAttributeSkillRatings(
  draft: Pick<
    PersistedCharacterDraft,
    'characterId' | 'revision' | 'attributes' | 'skills'
  >,
): CharacterAttributeSkillRatings {
  return Object.freeze({
    characterId: draft.characterId,
    revision: draft.revision,
    attributes: Object.freeze({
      ...draft.attributes,
    }),
    skills: Object.freeze({
      ...draft.skills,
    }),
  })
}
