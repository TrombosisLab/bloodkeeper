import type {
  CharacterDraftRepository,
} from './character-draft.repository'
import type {
  CharacterExperienceRepository,
} from './character-experience.repository'
import {
  CharacterAdvancementRevisionConflictError,
} from './character-experience.repository'
import {
  CharacterExperienceCharacterNotFoundError,
} from './character-experience.use-cases'
import {
  CharacterExperiencePermissionError,
} from './character-experience-permission'
import {
  previewCharacterAdvancement,
} from '../domain/character-advancement-cost.rules'
import {
  applyCharacterAdvancement,
  characterAdvancementAcquisitionKey,
  normalizeCharacterAdvancementMutation,
} from '../domain/character-advancement-apply.rules'
import type {
  CharacterAdvancementPreview,
  CharacterAdvancementRequest,
} from '../domain/character-advancement.types'
import type {
  CharacterExperienceLedger,
} from '../domain/character-experience.types'
import type {
  CharacterRulesCatalog,
} from '../domain/character-rules-catalog'
import {
  InvalidPersistedCharacterStateError,
} from '../domain/character-validator'
import type {
  CharacterValidator,
} from '../domain/character-validator'
import type {
  CharacterValidationReport,
} from '../domain/character-validation.types'
import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export interface PurchaseCharacterAdvancementCommand {
  readonly characterId: string
  readonly expectedRevision: number
  readonly operationId: string
  readonly advancement: CharacterAdvancementRequest
}

export interface PurchaseCharacterAdvancementResult {
  readonly character: PersistedCharacterDraft
  readonly experience: CharacterExperienceLedger
  readonly preview: CharacterAdvancementPreview
  readonly validation: CharacterValidationReport
}

export class CharacterAdvancementRejectedError extends Error {
  constructor(readonly preview: CharacterAdvancementPreview) {
    super('Character advancement is not eligible')
    this.name = 'CharacterAdvancementRejectedError'
  }
}

export class PurchaseCharacterAdvancementUseCase {
  constructor(
    private readonly drafts: CharacterDraftRepository,
    private readonly experience: CharacterExperienceRepository,
    private readonly catalog: CharacterRulesCatalog,
    private readonly validator: CharacterValidator,
  ) {}

  async execute(
    actorUserId: string,
    command: PurchaseCharacterAdvancementCommand,
  ): Promise<PurchaseCharacterAdvancementResult> {
    const access = await this.experience.findCharacter(command.characterId)
    if (access === null) throw new CharacterExperienceCharacterNotFoundError(command.characterId)
    if (access.ownerId !== actorUserId) throw new CharacterExperiencePermissionError()

    const [character, ledger] = await Promise.all([
      this.drafts.findById(actorUserId, command.characterId),
      this.experience.loadLedger(command.characterId),
    ])
    if (character === null) throw new CharacterExperienceCharacterNotFoundError(command.characterId)
    if (character.revision !== command.expectedRevision) {
      throw new CharacterAdvancementRevisionConflictError(command.characterId)
    }

    const preview = previewCharacterAdvancement(
      character,
      ledger.available,
      command.advancement,
      this.catalog,
    )
    if (!preview.eligible || preview.cost === null) {
      throw new CharacterAdvancementRejectedError(preview)
    }

    const mutation = normalizeCharacterAdvancementMutation(
      character,
      command.advancement,
      command.operationId,
      this.catalog,
    )
    const projected = applyCharacterAdvancement(
      character,
      mutation,
      command.operationId,
    )
    const validation = this.validator.validate(projected, 'evolution')
    if (!validation.canProceed) {
      throw new InvalidPersistedCharacterStateError(validation)
    }

    const experience = await this.experience.purchase({
      characterId: command.characterId,
      actorId: actorUserId,
      expectedRevision: command.expectedRevision,
      operationId: command.operationId,
      cost: preview.cost,
      acquisitionType: mutation.kind,
      acquisitionKey: characterAdvancementAcquisitionKey(mutation),
      mutation,
    })
    const updated = await this.drafts.findById(actorUserId, command.characterId)
    if (updated === null) {
      throw new CharacterAdvancementRevisionConflictError(command.characterId)
    }

    return { character: updated, experience, preview, validation }
  }
}
