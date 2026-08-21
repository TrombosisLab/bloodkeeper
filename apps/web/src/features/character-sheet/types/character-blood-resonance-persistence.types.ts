import type {
  CharacterRulesBloodDyscrasiaAcquisitionMode,
  CharacterRulesBloodDyscrasiaKey,
  CharacterRulesBloodResonanceKey,
  CharacterRulesBloodSourceKind,
  CharacterRulesBloodSpecialAffinityKey,
  CharacterRulesBloodTemperament,
} from '@v5r/character-rules'

import type {
  CharacterDraftApiSnapshot,
} from '../../character-creation/types/character-draft-api.types.ts'

export interface CharacterBloodResonanceApplyRequest {
  readonly expectedRevision: number
  readonly operationId: string
  readonly sourceKind:
    CharacterRulesBloodSourceKind
  readonly resonanceKey:
    CharacterRulesBloodResonanceKey | null
  readonly specialAffinityKey:
    CharacterRulesBloodSpecialAffinityKey | null
  readonly temperament:
    CharacterRulesBloodTemperament | null
  readonly dyscrasiaKey:
    CharacterRulesBloodDyscrasiaKey | null
  readonly dyscrasiaAcquisitionMode:
    CharacterRulesBloodDyscrasiaAcquisitionMode | null
  readonly hungerSlaked: number
}

export interface CharacterBloodResonanceGateway {
  apply(
    characterId: string,
    request:
      CharacterBloodResonanceApplyRequest,
  ): Promise<CharacterDraftApiSnapshot>
}
