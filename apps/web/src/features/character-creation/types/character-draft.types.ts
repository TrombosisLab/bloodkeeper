import type {
  CharacterIdentity,
} from '../../character-sheet/types/character-sheet.types'

import type {
  CharacterAttributesDraft,
} from './character-attributes-draft.types'

import type {
  CharacterSkillSpecialtiesDraft,
  CharacterSkillsDraft,
  SkillDistributionMethod,
} from './character-skills-draft.types'

export interface CharacterDraft {
  identity: CharacterIdentity
  attributes: CharacterAttributesDraft
  skills: CharacterSkillsDraft
  skillSpecialties: CharacterSkillSpecialtiesDraft
  skillDistributionMethod: SkillDistributionMethod
}
