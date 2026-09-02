import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  CharacterExperienceRepository,
} from './character-experience.repository'

import type {
  CharacterSecondaryRepository,
} from './character-secondary.repository'

import type {
  CharacterSheetPdfDocument,
  CharacterSheetPdfFormat,
  CharacterSheetPdfRenderer,
} from './character-sheet-pdf.types'

export class CharacterSheetPdfNotFoundError
  extends Error {
  constructor(characterId: string) {
    super(`Character not found: ${characterId}`)
    this.name = 'CharacterSheetPdfNotFoundError'
  }
}

function safeFilePart(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return normalized || 'personaje'
}

export class ExportCharacterSheetPdfUseCase {
  constructor(
    private readonly characters:
      CharacterDraftRepository,
    private readonly secondary:
      CharacterSecondaryRepository,
    private readonly experience:
      CharacterExperienceRepository,
    private readonly renderer:
      CharacterSheetPdfRenderer,
  ) {}

  async execute(
    ownerId: string,
    characterId: string,
    format: CharacterSheetPdfFormat,
  ): Promise<CharacterSheetPdfDocument> {
    const character =
      await this.characters.findById(
        ownerId,
        characterId,
      )

    if (character === null) {
      throw new CharacterSheetPdfNotFoundError(
        characterId,
      )
    }

    const [secondary, experience] =
      await Promise.all([
        this.secondary.findByCharacterId(
          ownerId,
          characterId,
        ),
        this.experience.loadLedger(
          characterId,
        ),
      ])

    const bytes = await this.renderer.render(
      {
        character,
        secondary,
        experience,
      },
      format,
    )

    return {
      bytes,
      fileName:
        `${safeFilePart(character.identity.name)}` +
        `-V5-${format}.pdf`,
    }
  }
}
