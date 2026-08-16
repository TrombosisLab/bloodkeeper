import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import {
  CharacterInitialVampireResolutionWriteConflictError,
} from './character-draft.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import {
  characterBloodPotencyRanges,
} from '../domain/character-blood-potency.rules'

import {
  deriveCharacterEmbracePendingDecisions,
} from '../domain/character-embrace.types'

import {
  validateCharacterHunger,
} from '../domain/character-hunger.rules'

import type {
  InitialVampireResolutionResult,
  PersistInitialVampireResolutionData,
} from '../domain/character-initial-vampire-resolution.types'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

import type {
  CharacterRulesCatalog,
} from '../domain/character-rules-catalog'

import {
  validateInitialDisciplineManifestation,
  validateInitialPowerManifestation,
} from '../domain/character-initial-discipline.rules'

import type {
  InitialDisciplineViolation,
} from '../domain/character-initial-discipline.rules'

export interface ResolveInitialClanCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly clanKey: string
}

export interface ResolveInitialGenerationCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly generation: number
}

export interface EstablishInitialBloodCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly bloodPotency: number
  readonly hunger: number
}

export interface ManifestInitialDisciplineCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly disciplineKey: string
  readonly rating: number
}

export interface ManifestInitialPowerCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly disciplineKey: string
  readonly powerKey: string
}

export class InitialVampireResolutionNotFoundError
  extends Error {
  constructor(characterId: string) {
    super(`Character not found: ${characterId}`)
    this.name =
      'InitialVampireResolutionNotFoundError'
  }
}

export class InitialVampireResolutionPermissionError
  extends Error {
  constructor() {
    super(
      'Character owner or active contextual Narrator permission is required',
    )
    this.name =
      'InitialVampireResolutionPermissionError'
  }
}

export class InitialVampireResolutionArchivedError
  extends Error {
  constructor(characterId: string) {
    super(
      `Archived character cannot resolve initial vampire state: ${characterId}`,
    )
    this.name =
      'InitialVampireResolutionArchivedError'
  }
}

export class InitialVampireResolutionNatureError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character is not a vampire: ${characterId}`,
    )
    this.name =
      'InitialVampireResolutionNatureError'
  }
}

export class InitialVampireResolutionCreationModeError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character is not a Session Zero vampire: ${characterId}`,
    )
    this.name =
      'InitialVampireResolutionCreationModeError'
  }
}

export class InitialVampireDecisionAlreadyResolvedError
  extends Error {
  constructor(
    readonly decision:
      'clan' | 'generation' | 'bloodState',
  ) {
    super(
      `Initial vampire decision already resolved: ${decision}`,
    )
    this.name =
      'InitialVampireDecisionAlreadyResolvedError'
  }
}

export class InitialVampirePrerequisitePendingError
  extends Error {
  constructor(
    readonly prerequisite: 'generation',
  ) {
    super(
      `Initial vampire prerequisite is pending: ${prerequisite}`,
    )
    this.name =
      'InitialVampirePrerequisitePendingError'
  }
}

export type InitialVampireSelectionViolation =
  | 'CLAN_UNKNOWN'
  | 'GENERATION_UNSUPPORTED'
  | 'THIN_BLOOD_GENERATION_INVALID'
  | 'BLOOD_POTENCY_INVALID_FOR_GENERATION'
  | 'THIN_BLOOD_BLOOD_POTENCY_INVALID'
  | 'HUNGER_VALUE_INVALID'
  | 'EXISTING_BLOOD_INCOMPATIBLE_WITH_CLAN'
  | 'EXISTING_BLOOD_INCOMPATIBLE_WITH_GENERATION'

export class InitialVampireDisciplineInvalidError
  extends Error {
  constructor(
    readonly violations:
      readonly InitialDisciplineViolation[],
  ) {
    super(
      'Initial vampire Discipline manifestation violates creation rules',
    )
    this.name =
      'InitialVampireDisciplineInvalidError'
  }
}

export class InitialVampireSelectionInvalidError
  extends Error {
  constructor(
    readonly violations:
      readonly InitialVampireSelectionViolation[],
  ) {
    super(
      'Initial vampire selection is incompatible with current V5 rules',
    )
    this.name =
      'InitialVampireSelectionInvalidError'
  }
}

export class ResolveInitialVampireStateUseCase {
  constructor(
    private readonly characters:
      CharacterDraftRepository,
    private readonly participants:
      ChronicleParticipantRepository,
    private readonly catalog:
      CharacterRulesCatalog,
  ) {}

  private async assertPermission(
    actorUserId: string,
    character: Pick<
      PersistedCharacterDraft,
      'ownerId' | 'chronicleId'
    >,
  ): Promise<void> {
    if (character.chronicleId === null) {
      if (character.ownerId !== actorUserId) {
        throw new InitialVampireResolutionPermissionError()
      }

      return
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
      throw new InitialVampireResolutionPermissionError()
    }
  }

  private async load(
    actorUserId: string,
    characterId: string,
    expectedRevision: number,
  ): Promise<PersistedCharacterDraft> {
    const current =
      await this.characters.findByCharacterId(
        characterId,
      )

    if (current === null) {
      throw new InitialVampireResolutionNotFoundError(
        characterId,
      )
    }

    await this.assertPermission(
      actorUserId,
      current,
    )

    if (current.status === 'archived') {
      throw new InitialVampireResolutionArchivedError(
        characterId,
      )
    }

    if (current.revision !== expectedRevision) {
      throw new CharacterInitialVampireResolutionWriteConflictError(
        characterId,
      )
    }

    if (current.nature !== 'vampire') {
      throw new InitialVampireResolutionNatureError(
        characterId,
      )
    }

    if (
      current.creation.creationMode !==
      'sessionZero'
    ) {
      throw new InitialVampireResolutionCreationModeError(
        characterId,
      )
    }

    return current
  }

  private finish(
    before: PersistedCharacterDraft,
    character: PersistedCharacterDraft,
  ): InitialVampireResolutionResult {
    if (
      character.humanity.value !==
        before.humanity.value ||
      character.humanity.stains !==
        before.humanity.stains
    ) {
      throw new Error(
        'INITIAL_VAMPIRE_RESOLUTION_CHANGED_HUMANITY',
      )
    }

    return {
      character,
      pendingDecisions:
        deriveCharacterEmbracePendingDecisions(
          character,
        ),
    }
  }

  private clanKnown(
    clanKey: string,
  ): boolean {
    return this.catalog.disciplineCatalog
      .clanAffinities.some(
        (definition) =>
          definition.clanKey === clanKey,
      )
  }

  private validateThinBloodCompatibility(
    character: PersistedCharacterDraft,
    clanKey: string,
  ): InitialVampireSelectionViolation[] {
    if (clanKey !== 'thinBlood') {
      return []
    }

    const violations:
      InitialVampireSelectionViolation[] = []

    if (
      character.identity.generation !== null &&
      ![14, 15, 16].includes(
        character.identity.generation,
      )
    ) {
      violations.push(
        'THIN_BLOOD_GENERATION_INVALID',
      )
    }

    if (
      character.blood !== null &&
      character.blood.bloodPotency !== 0
    ) {
      violations.push(
        'EXISTING_BLOOD_INCOMPATIBLE_WITH_CLAN',
      )
    }

    return violations
  }

  async resolveClan(
    actorUserId: string,
    command: ResolveInitialClanCommand,
  ): Promise<InitialVampireResolutionResult> {
    const current = await this.load(
      actorUserId,
      command.characterId,
      command.expectedRevision,
    )

    if (current.identity.clanKey !== null) {
      throw new InitialVampireDecisionAlreadyResolvedError(
        'clan',
      )
    }

    const violations:
      InitialVampireSelectionViolation[] = []

    if (!this.clanKnown(command.clanKey)) {
      violations.push('CLAN_UNKNOWN')
    } else {
      violations.push(
        ...this.validateThinBloodCompatibility(
          current,
          command.clanKey,
        ),
      )
    }

    if (violations.length > 0) {
      throw new InitialVampireSelectionInvalidError(
        violations,
      )
    }

    const character =
      await this.characters.resolveInitialVampireState({
        kind: 'clan',
        characterId: command.characterId,
        expectedRevision:
          command.expectedRevision,
        clanKey: command.clanKey,
      })

    return this.finish(current, character)
  }

  async resolveGeneration(
    actorUserId: string,
    command: ResolveInitialGenerationCommand,
  ): Promise<InitialVampireResolutionResult> {
    const current = await this.load(
      actorUserId,
      command.characterId,
      command.expectedRevision,
    )

    if (current.identity.generation !== null) {
      throw new InitialVampireDecisionAlreadyResolvedError(
        'generation',
      )
    }

    const range =
      characterBloodPotencyRanges[
        command.generation
      ]

    const violations:
      InitialVampireSelectionViolation[] = []

    if (range === undefined) {
      violations.push('GENERATION_UNSUPPORTED')
    }

    if (
      current.identity.clanKey ===
        'thinBlood' &&
      ![14, 15, 16].includes(
        command.generation,
      )
    ) {
      violations.push(
        'THIN_BLOOD_GENERATION_INVALID',
      )
    }

    if (
      range !== undefined &&
      current.blood !== null &&
      (
        current.blood.bloodPotency <
          range.min ||
        current.blood.bloodPotency >
          range.max
      )
    ) {
      violations.push(
        'EXISTING_BLOOD_INCOMPATIBLE_WITH_GENERATION',
      )
    }

    if (
      current.identity.clanKey ===
        'thinBlood' &&
      current.blood !== null &&
      current.blood.bloodPotency !== 0
    ) {
      violations.push(
        'THIN_BLOOD_BLOOD_POTENCY_INVALID',
      )
    }

    if (violations.length > 0) {
      throw new InitialVampireSelectionInvalidError(
        [...new Set(violations)],
      )
    }

    const character =
      await this.characters.resolveInitialVampireState({
        kind: 'generation',
        characterId: command.characterId,
        expectedRevision:
          command.expectedRevision,
        generation: command.generation,
      })

    return this.finish(current, character)
  }

  async establishBlood(
    actorUserId: string,
    command: EstablishInitialBloodCommand,
  ): Promise<InitialVampireResolutionResult> {
    const current = await this.load(
      actorUserId,
      command.characterId,
      command.expectedRevision,
    )

    if (current.blood !== null) {
      throw new InitialVampireDecisionAlreadyResolvedError(
        'bloodState',
      )
    }

    const generation =
      current.identity.generation

    if (generation === null) {
      throw new InitialVampirePrerequisitePendingError(
        'generation',
      )
    }

    const range =
      characterBloodPotencyRanges[generation]

    const violations:
      InitialVampireSelectionViolation[] = []

    if (
      range === undefined ||
      !Number.isInteger(
        command.bloodPotency,
      ) ||
      command.bloodPotency < range.min ||
      command.bloodPotency > range.max
    ) {
      violations.push(
        'BLOOD_POTENCY_INVALID_FOR_GENERATION',
      )
    }

    if (
      current.identity.clanKey ===
        'thinBlood' &&
      command.bloodPotency !== 0
    ) {
      violations.push(
        'THIN_BLOOD_BLOOD_POTENCY_INVALID',
      )
    }

    if (
      validateCharacterHunger(
        command.hunger,
      ).length > 0
    ) {
      violations.push('HUNGER_VALUE_INVALID')
    }

    if (violations.length > 0) {
      throw new InitialVampireSelectionInvalidError(
        [...new Set(violations)],
      )
    }

    const data:
      PersistInitialVampireResolutionData = {
        kind: 'bloodState',
        characterId: command.characterId,
        expectedRevision:
          command.expectedRevision,
        blood: {
          bloodPotency:
            command.bloodPotency,
          hunger: command.hunger,
        },
      }

    const character =
      await this.characters.resolveInitialVampireState(
        data,
      )

    return this.finish(current, character)
  }

  async manifestDiscipline(
    actorUserId: string,
    command: ManifestInitialDisciplineCommand,
  ): Promise<InitialVampireResolutionResult> {
    const current = await this.load(
      actorUserId,
      command.characterId,
      command.expectedRevision,
    )

    const violations =
      validateInitialDisciplineManifestation(
        current,
        command.disciplineKey,
        command.rating,
        this.catalog,
      )

    if (violations.length > 0) {
      throw new InitialVampireDisciplineInvalidError(
        violations,
      )
    }

    const character =
      await this.characters.resolveInitialVampireState({
        kind: 'discipline',
        characterId: command.characterId,
        expectedRevision:
          command.expectedRevision,
        disciplineKey:
          command.disciplineKey,
        rating: command.rating,
      })

    return this.finish(current, character)
  }

  async manifestPower(
    actorUserId: string,
    command: ManifestInitialPowerCommand,
  ): Promise<InitialVampireResolutionResult> {
    const current = await this.load(
      actorUserId,
      command.characterId,
      command.expectedRevision,
    )

    const violations =
      validateInitialPowerManifestation(
        current,
        command.disciplineKey,
        command.powerKey,
        this.catalog,
      )

    if (violations.length > 0) {
      throw new InitialVampireDisciplineInvalidError(
        violations,
      )
    }

    const character =
      await this.characters.resolveInitialVampireState({
        kind: 'power',
        characterId: command.characterId,
        expectedRevision:
          command.expectedRevision,
        disciplineKey:
          command.disciplineKey,
        powerKey: command.powerKey,
      })

    return this.finish(current, character)
  }

}
