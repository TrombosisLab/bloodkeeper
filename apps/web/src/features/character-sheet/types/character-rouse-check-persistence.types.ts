export type CharacterRouseCheckReason =
  | 'awakening'
  | 'blushOfLife'
  | 'bloodSurge'
  | 'healing'
  | 'disciplinePower'
  | 'ritualOrCeremony'
  | 'other'

export type CharacterRouseCheckConsequence =
  | {
      readonly kind: 'none'
    }
  | {
      readonly kind:
        'hungerFrenzyTestRequired'
      readonly difficulty: 4
    }
  | {
      readonly kind: 'torporTriggered'
    }

export interface CharacterRouseCheckRequest {
  readonly expectedRevision: number
  readonly operationId: string

  /*
   * SPEC-059-C publica sólo la acción manual genérica.
   * Los contextos reales pertenecen a 059-D.
   */
  readonly reason: 'other'
}

export interface CharacterRouseCheckResult {
  readonly operationId: string
  readonly reason: CharacterRouseCheckReason
  readonly rolls: readonly number[]
  readonly selectedResult: number
  readonly success: boolean
  readonly hungerBefore: number
  readonly hungerAfter: number
  readonly consequence:
    CharacterRouseCheckConsequence
  readonly rollHistoryId: string
  readonly characterRevision: number
  readonly createdAt: string
}

export interface CharacterRouseCheckGateway {
  execute(
    characterId: string,
    request: CharacterRouseCheckRequest,
  ): Promise<CharacterRouseCheckResult>
}
