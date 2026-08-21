export interface CharacterBlushOfLifeRequest {
  readonly expectedRevision: number
  readonly operationId: string
}

export type CharacterBlushOfLifeConsequence =
  | { readonly kind: 'none' }
  | {
      readonly kind: 'hungerFrenzyTestRequired'
      readonly difficulty: 4
    }
  | { readonly kind: 'torporTriggered' }

export interface CharacterBlushOfLifeRouseResult {
  readonly operationId: string
  readonly reason: 'blushOfLife'
  readonly rolls: readonly number[]
  readonly selectedResult: number
  readonly success: boolean
  readonly hungerBefore: number
  readonly hungerAfter: number
  readonly consequence:
    CharacterBlushOfLifeConsequence
  readonly rollHistoryId: string
  readonly characterRevision: number
  readonly createdAt: string
}

export type CharacterBlushOfLifeResult =
  | {
      readonly outcome: 'rouseResolved'
      readonly rouse:
        CharacterBlushOfLifeRouseResult
    }
  | {
      readonly outcome: 'rouseExempted'
      readonly operationId: string
      readonly exemption: {
        readonly source: 'dyscrasia'
        readonly dyscrasiaKey: string
        readonly sourceBloodOperationId:
          string
      }
      readonly hungerBefore: number
      readonly hungerAfter: number
      readonly characterRevision: number
      readonly createdAt: string
    }

export interface CharacterBlushOfLifeGateway {
  useBlushOfLife(
    characterId: string,
    request:
      CharacterBlushOfLifeRequest,
  ): Promise<CharacterBlushOfLifeResult>
}
