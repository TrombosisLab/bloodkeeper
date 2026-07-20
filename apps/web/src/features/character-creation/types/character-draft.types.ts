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

import type {
  CharacterDisciplinesDraft,
} from './discipline.types'

export interface CharacterDraft {
  identity: CharacterIdentityDraft
  attributes: CharacterAttributesDraft
  blood: CharacterBloodDraft
  disciplines: CharacterDisciplinesDraft
  skills: CharacterSkillsDraft
  skillSpecialties: CharacterSkillSpecialtiesDraft
  skillDistributionMethod: SkillDistributionMethod
}
