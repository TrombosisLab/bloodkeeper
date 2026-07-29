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

import type {
  CharacterBloodSorceryRitualsDraft,
} from './blood-sorcery-ritual.types'

import type {
  CharacterOblivionCeremoniesDraft,
} from './oblivion-ceremony.types'

import type {
  CharacterThinBloodAlchemyDraft,
} from './thin-blood-alchemy.types'


import type {
  CharacterAdvantagesDraft,
} from './character-advantages-draft.types'

import type {
  CharacterThinBloodTraitsDraft,
} from './thin-blood-trait.types'

import type {
  CharacterHumanityDraft,
} from './character-humanity-draft.types'

export interface CharacterDraft {
  identity: CharacterIdentityDraft
  attributes: CharacterAttributesDraft
  blood: CharacterBloodDraft
  disciplines: CharacterDisciplinesDraft
  bloodSorceryRituals: CharacterBloodSorceryRitualsDraft
  oblivionCeremonies: CharacterOblivionCeremoniesDraft
  thinBloodAlchemy: CharacterThinBloodAlchemyDraft
  thinBloodTraits: CharacterThinBloodTraitsDraft
  advantages: CharacterAdvantagesDraft
  humanity: CharacterHumanityDraft
  skills: CharacterSkillsDraft
  skillSpecialties: CharacterSkillSpecialtiesDraft
  skillDistributionMethod: SkillDistributionMethod
}
