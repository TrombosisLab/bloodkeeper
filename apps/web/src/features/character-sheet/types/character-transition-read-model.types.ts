import type {
  CharacterDraftApiAdvantageSelection,
  CharacterDraftApiBlood,
  CharacterDraftApiCreationMode,
  CharacterDraftApiDiscipline,
  CharacterDraftApiLifecycleStatus,
  CharacterDraftApiThinBloodTrait,
} from '../../character-creation/types/character-draft-api.types.ts'

export type CharacterInitialVampirePendingDecision =
  | 'clan'
  | 'generation'
  | 'sire'
  | 'bloodState'
  | 'thinBloodState'
  | 'predatorType'
  | 'initialDisciplines'
  | 'initialPowers'
  | 'advantagesReview'

export interface CharacterInitialVampireTransitionReadModel {
  readonly characterId: string
  readonly revision: number
  readonly status:
    CharacterDraftApiLifecycleStatus
  readonly phase:
    'TRANSITIONAL_VAMPIRE'
  readonly pendingDecisions:
    readonly CharacterInitialVampirePendingDecision[]
  readonly creationMode:
    CharacterDraftApiCreationMode

  readonly identity: {
    readonly clanKey: string | null
    readonly generation: number | null
    readonly sire: string | null
    readonly predatorTypeKey: string | null
  }

  readonly predatorTypeChoices:
    Readonly<Record<string, number>>

  readonly blood:
    CharacterDraftApiBlood | null

  readonly disciplines:
    readonly CharacterDraftApiDiscipline[]

  readonly advantages: {
    readonly selections:
      readonly CharacterDraftApiAdvantageSelection[]
  }

  readonly thinBloodTraits:
    readonly CharacterDraftApiThinBloodTrait[]

  readonly thinBloodAlchemy: {
    readonly rating: number
    readonly method:
      'athanorCorporis'
      | 'calcinatio'
      | 'fixatio'
      | null
    readonly formulaKeys:
      readonly string[]
  } | null
}
