import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common'

import {
  CharacterSheetPdfNotFoundError,
  ExportCharacterSheetPdfUseCase,
} from '../application/export-character-sheet-pdf.use-case'

import type {
  CharacterSheetPdfFormat,
} from '../application/character-sheet-pdf.types'

import {
  parseCharacterDraftIdParam,
  parseCharacterDraftOwnerId,
} from './character-draft.dto'

interface AuthenticatedPdfRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function ownerId(
  request: AuthenticatedPdfRequest,
): string {
  try {
    return parseCharacterDraftOwnerId(
      request.user?.id,
    )
  } catch {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }
}

function formatValue(
  input: unknown,
): CharacterSheetPdfFormat {
  if (
    input === undefined ||
    input === 'editable'
  ) {
    return 'editable'
  }

  if (input === 'print') {
    return 'print'
  }

  throw new BadRequestException({
    code: 'INVALID_CHARACTER_SHEET_PDF_FORMAT',
  })
}

@Controller('characters')
export class CharacterSheetPdfController {
  constructor(
    private readonly exportPdf:
      ExportCharacterSheetPdfUseCase,
  ) {}

  @Get(':characterId/sheet.pdf')
  async download(
    @Req() request: AuthenticatedPdfRequest,
    @Param('characterId') characterIdInput: unknown,
    @Query('format') formatInput: unknown,
  ): Promise<StreamableFile> {
    const authenticatedOwnerId = ownerId(request)
    const characterId =
      parseCharacterDraftIdParam(
        characterIdInput,
      )
    const format = formatValue(formatInput)

    try {
      const document =
        await this.exportPdf.execute(
          authenticatedOwnerId,
          characterId,
          format,
        )

      return new StreamableFile(
        Buffer.from(document.bytes),
        {
          type: 'application/pdf',
          disposition:
            `attachment; filename="${document.fileName}"`,
          length: document.bytes.byteLength,
        },
      )
    } catch (error: unknown) {
      if (
        error instanceof
          CharacterSheetPdfNotFoundError
      ) {
        throw new NotFoundException({
          code: 'CHARACTER_DRAFT_NOT_FOUND',
        })
      }

      throw error
    }
  }
}
