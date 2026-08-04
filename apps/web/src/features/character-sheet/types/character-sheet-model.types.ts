import type {
  CharacterAdvantages,
} from './character-advantages.types.ts'

import type {
  CharacterAttributeCategory,
} from './character-attributes.types.ts'

import type {
  CharacterNarrativeState,
} from './character-convictions.types.ts'

import type {
  CharacterDisciplineView,
} from './character-disciplines.types.ts'

import type {
  CharacterIdentity,
} from './character-sheet.types.ts'

import type {
  CharacterSkillCategory,
} from './character-skills.types.ts'

import type {
  CharacterState,
} from './character-state.types.ts'

import type {
  CharacterDamageTrack,
} from '../domain/damage-track-rules.ts'

export type CharacterSheetLifecycleStatus =
  | 'draft'
  | 'active'
  | 'archived'

export interface CharacterSheetDamageModel {
  health: CharacterDamageTrack
  healthCapacity: number
  willpower: CharacterDamageTrack
  willpowerCapacity: number
}

export interface CharacterSheetAvailability {
  /*
   * La API sólo expone chronicleId. El nombre visible se
   * resolverá cuando exista el catálogo persistido de Crónicas.
   */
  chronicleName: boolean

  /*
   * Resonancia, temperamento y experiencia todavía no forman
   * parte del contrato persistente de Fase 004.
   */
  bloodExperience: boolean
}

export interface CharacterSheetModel {
  characterId: string
  revision: number
  status: CharacterSheetLifecycleStatus
  chronicleId: string | null

  identity: CharacterIdentity
  attributes: CharacterAttributeCategory[]
  skills: CharacterSkillCategory[]
  state: CharacterState
  damage: CharacterSheetDamageModel
  disciplines: CharacterDisciplineView[]
  advantages: CharacterAdvantages
  narrative: CharacterNarrativeState

  availability: CharacterSheetAvailability
}
