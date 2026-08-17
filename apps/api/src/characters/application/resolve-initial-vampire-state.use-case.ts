import { createHash } from 'node:crypto'

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

import type {
  CharacterEmbracePendingDecision,
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

import type {
  CharacterValidator,
} from '../domain/character-validator'

import type {
  CharacterValidationReport,
} from '../domain/character-validation.types'

import {
  deriveCharacterProfilePhase,
} from '../domain/character-transition.rules'

import type {
  CharacterProfilePhase,
} from '../domain/character-transition.rules'

import {
  validateInitialDisciplineManifestation,
  validateInitialPowerManifestation,
} from '../domain/character-initial-discipline.rules'

import {
  analyzeInitialAdvantageReview,
  validateInitialAdvantageReplacement,
} from '../domain/character-initial-advantage.rules'

import {
  analyzeInitialPredatorAdoption,
} from '../domain/character-initial-predator.rules'

import type {
  InitialPredatorAdoptionPlan,
} from '../domain/character-initial-predator.rules'

import {
  analyzeInitialThinBloodResolution,
} from '../domain/character-initial-thin-blood.rules'

import type {
  CharacterThinBloodRuleIssue,
} from '../domain/character-thin-blood.rules'

import type {
  InitialDisciplineViolation,
} from '../domain/character-initial-discipline.rules'

import type {
  CharacterValidationIssue,
} from '../domain/character-validation.types'

import type {
  PersistedCharacterAdvantages,
  PersistedCharacterThinBloodAlchemy,
  PersistedCharacterThinBloodTrait,
} from '../domain/persisted-character.types'

const INITIAL_VAMPIRE_PROFILE_CONSOLIDATION_ID_NAMESPACE =
  'bloodkeeper:character-profile-consolidation:v1'

export function deriveInitialVampireProfileConsolidationHistoryEntryId(
  characterId: string,
): string {
  const hash = createHash('sha256')
    .update(
      `${INITIAL_VAMPIRE_PROFILE_CONSOLIDATION_ID_NAMESPACE}:${characterId}`,
    )
    .digest('hex')
    .slice(0, 32)

  const variantNibble = (
    (
      Number.parseInt(
        hash.slice(16, 17),
        16,
      ) &
      0x3
    ) |
    0x8
  ).toString(16)

  const uuidHex =
    `${hash.slice(0, 12)}8${hash.slice(13, 16)}` +
    `${variantNibble}${hash.slice(17)}`

  return (
    `${uuidHex.slice(0, 8)}-` +
    `${uuidHex.slice(8, 12)}-` +
    `${uuidHex.slice(12, 16)}-` +
    `${uuidHex.slice(16, 20)}-` +
    uuidHex.slice(20)
  )
}

export interface ConsolidateInitialVampireProfileCommand {
  readonly characterId: string
  readonly expectedRevision: number
}

export interface InitialVampireProfileConsolidationResult {
  readonly character: PersistedCharacterDraft
  readonly pendingDecisions:
    readonly CharacterEmbracePendingDecision[]
  readonly phase: CharacterProfilePhase
}

export class InitialVampireProfileIncompleteError
  extends Error {
  readonly report:
    CharacterValidationReport

  constructor(
    report: CharacterValidationReport,
  ) {
    super(
      'Initial vampire profile is not mechanically complete',
    )
    this.name =
      'InitialVampireProfileIncompleteError'
    this.report = report
  }
}

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

export interface ResolveInitialSireCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly sire: string
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

export interface ReviewInitialAdvantagesCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly advantages:
    PersistedCharacterAdvantages
}

export interface ResolveInitialThinBloodStateCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly thinBloodTraits:
    readonly PersistedCharacterThinBloodTrait[]
  readonly thinBloodAlchemy:
    PersistedCharacterThinBloodAlchemy
}

export interface AdoptInitialPredatorTypeCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly predatorTypeKey: string
  readonly predatorTypeChoices:
    Readonly<Record<string, number>>
  readonly disciplinePowerKey: string
  readonly advantages:
    PersistedCharacterAdvantages
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
      CharacterEmbracePendingDecision,
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

export class InitialVampireThinBloodInvalidError
  extends Error {
  constructor(
    readonly issues:
      readonly CharacterThinBloodRuleIssue[],
  ) {
    super(
      'Initial Thin-Blood resolution violates current V5 rules',
    )
    this.name =
      'InitialVampireThinBloodInvalidError'
  }
}

export class InitialVampirePredatorInvalidError
  extends Error {
  constructor(
    readonly issues:
      readonly CharacterValidationIssue[],
  ) {
    super(
      'Initial vampire Predator Type adoption violates current V5 rules',
    )
    this.name =
      'InitialVampirePredatorInvalidError'
  }
}

export class InitialVampireAdvantagesInvalidError
  extends Error {
  constructor(
    readonly issues:
      readonly CharacterValidationIssue[],
  ) {
    super(
      'Initial vampire Advantage review violates creation rules',
    )
    this.name =
      'InitialVampireAdvantagesInvalidError'
  }
}

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
    private readonly validator?:
      CharacterValidator,
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

  private async loadForConsolidation(
    actorUserId: string,
    characterId: string,
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

  private finishPredator(
    before: PersistedCharacterDraft,
    character: PersistedCharacterDraft,
    plan: InitialPredatorAdoptionPlan,
  ): InitialVampireResolutionResult {
    if (
      character.identity.predatorTypeKey !==
        plan.predatorTypeKey ||
      character.humanity.value !==
        plan.humanityValue ||
      character.humanity.stains !==
        before.humanity.stains ||
      character.blood === null ||
      character.blood.bloodPotency !==
        plan.bloodPotency
    ) {
      throw new Error(
        'INITIAL_PREDATOR_PERSISTENCE_MISMATCH',
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

  async resolveSire(
    actorUserId: string,
    command: ResolveInitialSireCommand,
  ): Promise<InitialVampireResolutionResult> {
    const current = await this.load(
      actorUserId,
      command.characterId,
      command.expectedRevision,
    )

    if (current.identity.sire !== null) {
      throw new InitialVampireDecisionAlreadyResolvedError(
        'sire',
      )
    }

    const character =
      await this.characters.resolveInitialVampireState({
        kind: 'sire',
        characterId: command.characterId,
        expectedRevision:
          command.expectedRevision,
        sire: command.sire,
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


  async reviewAdvantages(
    actorUserId: string,
    command: ReviewInitialAdvantagesCommand,
  ): Promise<InitialVampireResolutionResult> {
    const current = await this.load(
      actorUserId,
      command.characterId,
      command.expectedRevision,
    )

    const review =
      analyzeInitialAdvantageReview(
        current,
        this.catalog,
      )

    if (!review.required) {
      throw new InitialVampireDecisionAlreadyResolvedError(
        'advantagesReview',
      )
    }

    const issues =
      validateInitialAdvantageReplacement(
        current,
        command.advantages,
        this.catalog,
      )

    if (issues.length > 0) {
      throw new InitialVampireAdvantagesInvalidError(
        issues,
      )
    }

    const character =
      await this.characters.resolveInitialVampireState({
        kind: 'advantagesReview',
        characterId: command.characterId,
        expectedRevision:
          command.expectedRevision,
        advantages:
          command.advantages,
      })

    return this.finish(current, character)
  }


  async adoptPredatorType(
    actorUserId: string,
    command: AdoptInitialPredatorTypeCommand,
  ): Promise<InitialVampireResolutionResult> {
    const current = await this.load(
      actorUserId,
      command.characterId,
      command.expectedRevision,
    )

    if (
      current.identity.predatorTypeKey !== null
    ) {
      throw new InitialVampireDecisionAlreadyResolvedError(
        'predatorType',
      )
    }

    const analysis =
      analyzeInitialPredatorAdoption(
        current,
        {
          predatorTypeKey:
            command.predatorTypeKey,
          predatorTypeChoices:
            command.predatorTypeChoices,
          disciplinePowerKey:
            command.disciplinePowerKey,
          advantages:
            command.advantages,
        },
        this.catalog,
      )

    if (
      analysis.plan === null ||
      analysis.issues.length > 0
    ) {
      throw new InitialVampirePredatorInvalidError(
        analysis.issues,
      )
    }

    const plan =
      analysis.plan

    const character =
      await this.characters.resolveInitialVampireState({
        kind: 'predatorType',
        characterId:
          command.characterId,
        expectedRevision:
          command.expectedRevision,
        predatorTypeKey:
          plan.predatorTypeKey,
        predatorTypeChoices:
          plan.predatorTypeChoices,
        humanityValue:
          plan.humanityValue,
        bloodPotency:
          plan.bloodPotency,
        bonusSkillKey:
          plan.bonusSkillKey,
        specialty:
          plan.specialty,
        discipline:
          plan.discipline,
        advantages:
          plan.advantages,
      })

    return this.finishPredator(
      current,
      character,
      plan,
    )
  }

  async resolveThinBloodState(
    actorUserId: string,
    command:
      ResolveInitialThinBloodStateCommand,
  ): Promise<InitialVampireResolutionResult> {
    const current = await this.load(
      actorUserId,
      command.characterId,
      command.expectedRevision,
    )

    if (
      current.thinBloodTraits.length > 0 ||
      current.thinBloodAlchemy !== null
    ) {
      throw new InitialVampireDecisionAlreadyResolvedError(
        'thinBloodState',
      )
    }

    const analysis =
      analyzeInitialThinBloodResolution(
        current,
        command.thinBloodTraits,
        command.thinBloodAlchemy,
        this.catalog,
      )

    if (
      analysis.plan === null ||
      analysis.issues.length > 0
    ) {
      throw new InitialVampireThinBloodInvalidError(
        analysis.issues,
      )
    }

    const plan = analysis.plan

    const character =
      await this.characters.resolveInitialVampireState({
        kind: 'thinBloodState',
        characterId:
          command.characterId,
        expectedRevision:
          command.expectedRevision,
        thinBloodTraits:
          plan.thinBloodTraits,
        thinBloodAlchemy:
          plan.thinBloodAlchemy,
        discipline:
          plan.discipline === null
            ? null
            : {
                disciplineKey:
                  plan.discipline
                    .disciplineKey,
                rating: 1,
                powerKey:
                  plan.discipline
                    .powerKeys[0],
              },
      })

    return this.finish(
      current,
      character,
    )
  }



  async consolidateProfile(
    actorUserId: string,
    command:
      ConsolidateInitialVampireProfileCommand,
  ): Promise<
    InitialVampireProfileConsolidationResult
  > {
    const current =
      await this.loadForConsolidation(
        actorUserId,
        command.characterId,
      )

    if (this.validator === undefined) {
      throw new Error(
        'INITIAL_VAMPIRE_CONSOLIDATION_VALIDATOR_REQUIRED',
      )
    }

    const validation =
      this.validator.validate(
        current,
        'activation',
      )

    const phase =
      deriveCharacterProfilePhase(
        current,
        validation.valid,
      )

    if (
      phase !== 'ESTABLISHED_VAMPIRE'
    ) {
      throw new InitialVampireProfileIncompleteError(
        validation,
      )
    }

    const character =
      await this.characters
        .consolidateInitialVampireProfile({
          characterId:
            command.characterId,
          expectedRevision:
            command.expectedRevision,
          historyEntryId:
            deriveInitialVampireProfileConsolidationHistoryEntryId(
              command.characterId,
            ),
        })

    return {
      character,
      pendingDecisions:
        deriveCharacterEmbracePendingDecisions(
          character,
        ),
      phase:
        'ESTABLISHED_VAMPIRE',
    }
  }

}
