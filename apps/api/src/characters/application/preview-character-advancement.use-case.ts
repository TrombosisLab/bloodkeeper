import type {
  CharacterDraftRepository,
} from './character-draft.repository'
import type {
  CharacterExperienceRepository,
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
  applyCharacterDisciplineResonanceEvidence,
} from '../domain/character-discipline-resonance-evidence.rules'
import {
  applyCharacterBloodDyscrasiaExperiencePreview,
  assessCharacterBloodDyscrasiaExperience,
  rejectCharacterBloodDyscrasiaExperiencePreview,
} from '../domain/character-blood-dyscrasia-experience.rules'
import {
  applyCharacterAdvancement,
  normalizeCharacterAdvancementMutation,
} from '../domain/character-advancement-apply.rules'
import type {
  CharacterValidator,
} from '../domain/character-validator'
import type {
  CharacterAdvancementPreview,
  CharacterAdvancementRequest,
} from '../domain/character-advancement.types'
import type {
  CharacterRulesCatalog,
} from '../domain/character-rules-catalog'

export class PreviewCharacterAdvancementUseCase {
  constructor(
    private readonly drafts: CharacterDraftRepository,
    private readonly experience: CharacterExperienceRepository,
    private readonly catalog: CharacterRulesCatalog,
    private readonly validator: CharacterValidator,
  ) {}

  async execute(
    actorUserId: string,
    characterId: string,
    request: CharacterAdvancementRequest,
    useDyscrasiaExperience = false,
  ): Promise<CharacterAdvancementPreview> {
    const access = await this.experience.findCharacter(characterId)
    if (access === null) throw new CharacterExperienceCharacterNotFoundError(characterId)
    if (access.ownerId !== actorUserId) throw new CharacterExperiencePermissionError()

    const [character, ledger] = await Promise.all([
      this.drafts.findById(actorUserId, characterId),
      this.experience.loadLedger(characterId),
    ])
    if (character === null) throw new CharacterExperienceCharacterNotFoundError(characterId)

    const dyscrasiaExperience =
      assessCharacterBloodDyscrasiaExperience(
        character.blood?.dyscrasia
          ?.key ?? null,
        request,
        useDyscrasiaExperience,
      )

    const previewAvailable =
      dyscrasiaExperience.status ===
        'available'
        ? ledger.available +
          dyscrasiaExperience
            .benefit.amount
        : ledger.available

    let preview = previewCharacterAdvancement(
      character,
      previewAvailable,
      request,
      this.catalog,
    )

    if (
      dyscrasiaExperience.status ===
        'available'
    ) {
      preview =
        applyCharacterBloodDyscrasiaExperiencePreview(
          preview,
          ledger.available,
          dyscrasiaExperience.benefit,
        )
    } else if (
      dyscrasiaExperience.status ===
        'unavailable'
    ) {
      preview =
        rejectCharacterBloodDyscrasiaExperiencePreview(
          preview,
          dyscrasiaExperience.message,
        )
    }

    if (
      request.kind === 'discipline' &&
      preview.eligible &&
      typeof this.drafts
        .listBloodResonanceOperations ===
        'function'
    ) {
      const resonanceOperations =
        await this.drafts
          .listBloodResonanceOperations(
            characterId,
          )

      preview =
        applyCharacterDisciplineResonanceEvidence(
          preview,
          request,
          resonanceOperations,
        )
    }

    if (!preview.eligible) return preview

    const acquisitionId = `preview:${request.kind}:${preview.key}`
    const mutation = normalizeCharacterAdvancementMutation(
      character,
      request,
      acquisitionId,
      this.catalog,
    )
    const projected = applyCharacterAdvancement(
      character,
      mutation,
      acquisitionId,
    )
    const validation = this.validator.validate(projected, 'evolution')
    const blocking = validation.issues.filter(
      ({ severity }) => severity === 'error',
    )

    return blocking.length === 0
      ? preview
      : {
          ...preview,
          eligible: false,
          issues: [
            ...preview.issues,
            ...blocking.map(({ code, message }) => ({ code, message })),
          ],
        }
  }
}
