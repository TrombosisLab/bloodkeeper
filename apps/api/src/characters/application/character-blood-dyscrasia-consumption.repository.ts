import type {
  ConsumeCharacterBloodDyscrasiaData,
  PersistedCharacterBloodDyscrasiaActiveInstance,
  PersistedCharacterBloodDyscrasiaConsumptionOperation,
} from '../domain/character-blood-dyscrasia-consumption.types'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export interface CharacterBloodDyscrasiaConsumptionRepository {
  findActiveBloodDyscrasia(
    characterId: string,
  ): Promise<
    PersistedCharacterBloodDyscrasiaActiveInstance | null
  >

  findBloodDyscrasiaConsumptionOperation(
    characterId: string,
    operationId: string,
  ): Promise<
    PersistedCharacterBloodDyscrasiaConsumptionOperation | null
  >

  findBloodDyscrasiaConsumptionBySource(
    characterId: string,
    sourceBloodOperationId: string,
  ): Promise<
    PersistedCharacterBloodDyscrasiaConsumptionOperation | null
  >

  consumeBloodDyscrasia(
    data: ConsumeCharacterBloodDyscrasiaData,
  ): Promise<PersistedCharacterDraft>
}

export class CharacterBloodDyscrasiaConsumptionWriteConflictError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character blood Dyscrasia ${characterId} was not found or has changed`,
    )
    this.name =
      'CharacterBloodDyscrasiaConsumptionWriteConflictError'
  }
}

export class CharacterBloodDyscrasiaConsumptionOperationConflictError
  extends Error {
  constructor(
    characterId: string,
    operationId: string,
  ) {
    super(
      `Character blood Dyscrasia consumption operation ${characterId}/${operationId} was already used with different data`,
    )
    this.name =
      'CharacterBloodDyscrasiaConsumptionOperationConflictError'
  }
}

export class CharacterBloodDyscrasiaAlreadyConsumedError
  extends Error {
  constructor(
    characterId: string,
    sourceBloodOperationId: string,
  ) {
    super(
      `Character blood Dyscrasia instance ${characterId}/${sourceBloodOperationId} was already consumed`,
    )
    this.name =
      'CharacterBloodDyscrasiaAlreadyConsumedError'
  }
}
