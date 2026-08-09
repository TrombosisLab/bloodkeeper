import {
  CharacterStateWriteConflictError,
} from './character-draft.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  assertValidCharacterDamageState,
} from '../domain/character-damage.rules'

import {
  assertValidCharacterHumanityState,
} from '../domain/character-humanity-state.rules'

import {
  assertValidCharacterHunger,
} from '../domain/character-hunger.rules'

import {
  assertCharacterStateEditable,
} from '../domain/character-state.rules'

import type {
  UpdateCharacterStateData,
} from '../domain/character-state.types'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export class UpdateCharacterStateUseCase {
  constructor(
    private readonly repository:
      CharacterDraftRepository,
  ) {}

  async execute(
    ownerId: string,
    data: UpdateCharacterStateData,
  ): Promise<PersistedCharacterDraft | null> {
    const current =
      await this.repository.findById(
        ownerId,
        data.characterId,
      )

    if (current === null) {
      return null
    }

    if (
      current.revision !== data.expectedRevision
    ) {
      throw new CharacterStateWriteConflictError(
        data.characterId,
      )
    }

    assertCharacterStateEditable(current.status)

    if (data.damage !== undefined) {
      assertValidCharacterDamageState(
        current.attributes,
        data.damage,
      )
    }

    if (
      data.humanityValue !== undefined ||
      data.humanityStains !== undefined
    ) {
      assertValidCharacterHumanityState(
        data.humanityValue ??
          current.humanity.value,
        data.humanityStains ??
          current.humanity.stains,
      )
    }

    if (data.hunger !== undefined) {
      assertValidCharacterHunger(
        data.hunger,
      )
    }

    return this.repository.updateState(
      ownerId,
      data,
    )
  }
}
