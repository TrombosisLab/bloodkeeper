import type {
  CharacterRouseCheckResult,
} from '../../character-sheet/types/character-rouse-check-persistence.types'

export type DisciplinePowerRouseProfileStatus =
  | 'unknownPower'
  | 'inactivePower'
  | 'notOwned'
  | 'bloodStateUnavailable'
  | 'noRouseCheck'
  | 'ready'
  | 'contextual'

export interface DisciplinePowerRouseProfile {
  readonly powerKey: string
  readonly powerName: string | null
  readonly disciplineKey: string | null
  readonly level: number | null
  readonly status: DisciplinePowerRouseProfileStatus
  readonly execution: 'none' | 'singleCheck' | 'contextual'
  readonly rouseCost: Readonly<Record<string, unknown>> | null
  readonly requiredChecks: number | null
  readonly dicePerCheck: 1 | 2 | null
  readonly exemptions: readonly unknown[]
}

export interface DisciplinePowerRouseProfilesSnapshot {
  readonly characterId: string
  readonly characterRevision: number
  readonly bloodPotency: number | null
  readonly profiles: readonly DisciplinePowerRouseProfile[]
}

export interface DisciplinePowerRouseCheckRequest {
  readonly expectedRevision: number
  readonly operationId: string
  readonly powerKey: string
}

export interface DisciplinePowerRouseGateway {
  load(
    characterId: string,
  ): Promise<DisciplinePowerRouseProfilesSnapshot>
  execute(
    characterId: string,
    request: DisciplinePowerRouseCheckRequest,
  ): Promise<CharacterRouseCheckResult>
}

