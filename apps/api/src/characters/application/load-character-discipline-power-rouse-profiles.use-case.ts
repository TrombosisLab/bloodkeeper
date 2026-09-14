import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  listCharacterDisciplinePowerRouseProfiles,
} from '../domain/discipline-power-rouse-profile'

import type {
  CharacterDisciplinePowerRouseProfile,
} from '../domain/discipline-power-rouse-profile'

import type {
  CharacterRulesCatalog,
} from '../domain/character-rules-catalog'

export class CharacterDisciplinePowerRouseProfilesNotFoundError
  extends Error {
  constructor(characterId: string) {
    super(`Character not found: ${characterId}`)
    this.name =
      'CharacterDisciplinePowerRouseProfilesNotFoundError'
  }
}

export class CharacterDisciplinePowerRouseProfilesPermissionError
  extends Error {
  constructor() {
    super(
      'Character owner or active contextual Narrator permission is required',
    )
    this.name =
      'CharacterDisciplinePowerRouseProfilesPermissionError'
  }
}

export interface CharacterDisciplinePowerRouseProfilesSnapshot {
  readonly characterId: string
  readonly characterRevision: number
  readonly bloodPotency: number | null
  readonly profiles:
    readonly CharacterDisciplinePowerRouseProfile[]
}

export class LoadCharacterDisciplinePowerRouseProfilesUseCase {
  constructor(
    private readonly characters:
      CharacterDraftRepository,
    private readonly participants:
      ChronicleParticipantRepository,
    private readonly catalog: CharacterRulesCatalog,
  ) {}

  private async assertPermission(
    actorUserId: string,
    character: {
      readonly ownerId: string
      readonly chronicleId: string | null
    },
  ): Promise<void> {
    if (character.ownerId === actorUserId) {
      return
    }

    if (character.chronicleId === null) {
      throw new CharacterDisciplinePowerRouseProfilesPermissionError()
    }

    const membership =
      await this.participants.findActiveMembership(
        character.chronicleId,
        actorUserId,
      )

    if (
      membership === null ||
      membership.role !== 'narrator'
    ) {
      throw new CharacterDisciplinePowerRouseProfilesPermissionError()
    }
  }

  async execute(
    actorUserId: string,
    characterId: string,
  ): Promise<CharacterDisciplinePowerRouseProfilesSnapshot> {
    const character =
      await this.characters.findByCharacterId(
        characterId,
      )

    if (character === null) {
      throw new CharacterDisciplinePowerRouseProfilesNotFoundError(
        characterId,
      )
    }

    await this.assertPermission(
      actorUserId,
      character,
    )

    return Object.freeze({
      characterId: character.characterId,
      characterRevision: character.revision,
      bloodPotency:
        character.blood?.bloodPotency ?? null,
      profiles:
        listCharacterDisciplinePowerRouseProfiles({
          catalog: this.catalog,
          character,
        }),
    })
  }
}
