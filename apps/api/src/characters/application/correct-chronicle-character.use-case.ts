import type {
  LoadChronicleCharacterUseCase,
} from './load-chronicle-character.use-case'
import type {
  CharacterCorrectionRepository,
} from './character-correction.repository'
import type {
  CharacterValidator,
} from '../domain/character-validator'
import type {
  PersistedCharacterDraft,
  UpdateCharacterDraftData,
} from '../domain/persisted-character.types'
import type {
  CharacterValidationIssue,
  CharacterValidationSection,
} from '../domain/character-validation.types'

export type ChronicleCharacterCorrectionChanges = Pick<
  UpdateCharacterDraftData,
  'attributes' | 'skills' | 'disciplines' | 'advantages'
>

export interface CorrectChronicleCharacterCommand
  extends ChronicleCharacterCorrectionChanges {
  readonly expectedRevision: number
  readonly reason: string
}

export class CharacterCorrectionRuleViolationError extends Error {
  readonly violations: readonly CharacterValidationIssue[]

  constructor(violations: readonly CharacterValidationIssue[]) {
    super('Character correction violates character rules')
    this.name = 'CharacterCorrectionRuleViolationError'
    this.violations = violations
  }
}

export class CharacterCorrectionConflictError extends Error {
  constructor() {
    super('The character changed before the correction could be saved')
    this.name = 'CharacterCorrectionConflictError'
  }
}

export class CorrectChronicleCharacterUseCase {
  private readonly loadCharacter: LoadChronicleCharacterUseCase
  private readonly corrections: CharacterCorrectionRepository
  private readonly validator: CharacterValidator

  constructor(
    loadCharacter: LoadChronicleCharacterUseCase,
    corrections: CharacterCorrectionRepository,
    validator: CharacterValidator,
  ) {
    this.loadCharacter = loadCharacter
    this.corrections = corrections
    this.validator = validator
  }

  async execute(
    actorId: string,
    chronicleId: string,
    characterId: string,
    command: CorrectChronicleCharacterCommand,
  ): Promise<PersistedCharacterDraft> {
    const current = await this.loadCharacter.execute(
      actorId,
      chronicleId,
      characterId,
    )

    if (current.status === 'archived') {
      throw new CharacterCorrectionConflictError()
    }
    if (current.revision !== command.expectedRevision) {
      throw new CharacterCorrectionConflictError()
    }

    const candidate: PersistedCharacterDraft = {
      ...current,
      ...(command.attributes === undefined
        ? {}
        : { attributes: { ...current.attributes, ...command.attributes } }),
      ...(command.skills === undefined
        ? {}
        : { skills: { ...current.skills, ...command.skills } }),
      ...(command.disciplines === undefined
        ? {}
        : { disciplines: command.disciplines }),
      ...(command.advantages === undefined
        ? {}
        : { advantages: command.advantages }),
    }

    const editedSections = new Set<CharacterValidationSection>([
      ...(command.attributes === undefined ? [] : ['attributes' as const]),
      ...(command.skills === undefined ? [] : ['skills' as const]),
      ...(command.disciplines === undefined ? [] : ['disciplines' as const]),
      ...(command.advantages === undefined ? [] : ['advantages' as const, 'dependencies' as const]),
    ])
    const violations = this.validator
      .validate(candidate, 'editing')
      .issues
      .filter((issue) => editedSections.has(issue.section as CharacterValidationSection) && issue.severity === 'error')
    if (violations.length > 0) {
      throw new CharacterCorrectionRuleViolationError(violations)
    }

    const { expectedRevision, reason, ...changes } = command
    return this.corrections.correctByNarrator(
      current.ownerId,
      {
        characterId,
        expectedRevision,
        ...changes,
      },
      {
        actorId,
        chronicleId,
        reason,
      },
    )
  }
}
