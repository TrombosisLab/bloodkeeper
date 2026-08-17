import type {
  CharacterDisciplineKey,
  CharacterSkillKey,
  PersistedCharacterAdvantages,
  PersistedCharacterBlood,
  PersistedCharacterDraft,
  PersistedCharacterSkillSpecialty,
  PersistedCharacterThinBloodAlchemy,
  PersistedCharacterThinBloodTrait,
} from './persisted-character.types'

import type {
  CharacterEmbracePendingDecision,
} from './character-embrace.types'

export type InitialVampireResolutionKind =
  | 'clan'
  | 'generation'
  | 'sire'
  | 'bloodState'
  | 'thinBloodState'
  | 'discipline'
  | 'power'
  | 'advantagesReview'
  | 'predatorType'

export type PersistInitialVampireResolutionData =
  | {
      readonly kind: 'clan'
      readonly characterId: string
      readonly expectedRevision: number
      readonly clanKey: string
    }
  | {
      readonly kind: 'generation'
      readonly characterId: string
      readonly expectedRevision: number
      readonly generation: number
    }
  | {
      readonly kind: 'sire'
      readonly characterId: string
      readonly expectedRevision: number
      readonly sire: string
    }
  | {
      readonly kind: 'bloodState'
      readonly characterId: string
      readonly expectedRevision: number
      readonly blood: PersistedCharacterBlood
    }
  | {
      readonly kind: 'thinBloodState'
      readonly characterId: string
      readonly expectedRevision: number
      readonly thinBloodTraits:
        readonly PersistedCharacterThinBloodTrait[]
      readonly thinBloodAlchemy:
        PersistedCharacterThinBloodAlchemy
      readonly discipline: {
        readonly disciplineKey:
          CharacterDisciplineKey
        readonly rating: 1
        readonly powerKey: string
      } | null
    }
  | {
      readonly kind: 'discipline'
      readonly characterId: string
      readonly expectedRevision: number
      readonly disciplineKey: string
      readonly rating: number
    }
  | {
      readonly kind: 'power'
      readonly characterId: string
      readonly expectedRevision: number
      readonly disciplineKey: string
      readonly powerKey: string
    }
  | {
      readonly kind: 'advantagesReview'
      readonly characterId: string
      readonly expectedRevision: number
      readonly advantages:
        PersistedCharacterAdvantages
    }
  | {
      readonly kind: 'predatorType'
      readonly characterId: string
      readonly expectedRevision: number
      readonly predatorTypeKey: string
      readonly predatorTypeChoices:
        Readonly<Record<string, number>>
      readonly humanityValue: number
      readonly bloodPotency: number
      readonly bonusSkillKey:
        CharacterSkillKey | null
      readonly specialty:
        PersistedCharacterSkillSpecialty | null
      readonly discipline: {
        readonly disciplineKey: string
        readonly rating: number
        readonly powerKey: string
      }
      readonly advantages:
        PersistedCharacterAdvantages
    }

export interface InitialVampireResolutionResult {
  readonly character: PersistedCharacterDraft
  readonly pendingDecisions:
    readonly CharacterEmbracePendingDecision[]
}

export const CHARACTER_PROFILE_CONSOLIDATION_HISTORY_TITLE =
  'Consolidación del perfil vampírico'

export const CHARACTER_PROFILE_CONSOLIDATION_HISTORY_DESCRIPTION =
  'El perfil vampírico inicial del personaje se ha consolidado.'

export interface PersistInitialVampireProfileConsolidationData {
  readonly characterId: string
  readonly expectedRevision: number
  readonly historyEntryId: string
}
