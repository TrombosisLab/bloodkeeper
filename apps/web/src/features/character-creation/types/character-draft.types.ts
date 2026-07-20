import type {
  CharacterAttributesDraft,
} from './character-attributes-draft.types'

import type {
  CharacterIdentityDraft,
} from './character-identity-draft.types'

import type {
  CharacterBloodDraft,
} from './character-blood-draft.types'

import type {
  CharacterSkillSpecialtiesDraft,
  CharacterSkillsDraft,
  SkillDistributionMethod,
} from './character-skills-draft.types'

export interface CharacterDraft {
  identity: CharacterIdentityDraft
  attributes: CharacterAttributesDraft
  blood: CharacterBloodDraft
  skills: CharacterSkillsDraft
  skillSpecialties: CharacterSkillSpecialtiesDraft
  skillDistributionMethod: SkillDistributionMethod
}
