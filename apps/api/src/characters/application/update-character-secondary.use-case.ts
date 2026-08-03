import type {
  CharacterSecondaryRepository,
} from './character-secondary.repository'

import {
  assertValidCharacterSecondaryUpdate,
} from '../domain/character-secondary.rules'

import type {
  PersistedCharacterSecondaryData,
  UpdateCharacterSecondaryData,
} from '../domain/persisted-character-secondary.types'

export class UpdateCharacterSecondaryUseCase {
  constructor(
    private readonly repository:
      CharacterSecondaryRepository,
  ) {}

  execute(
    ownerId: string,
    data: UpdateCharacterSecondaryData,
  ): Promise<PersistedCharacterSecondaryData> {
    assertValidCharacterSecondaryUpdate(data)
    return this.repository.update(ownerId, data)
  }
}
