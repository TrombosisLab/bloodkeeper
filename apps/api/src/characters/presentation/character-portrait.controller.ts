import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  PayloadTooLargeException,
  Put,
  Req,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common'
import { createHash } from 'node:crypto'

import { DatabaseService } from '../../database/database.service'
import {
  parseCharacterDraftIdParam,
  parseCharacterDraftOwnerId,
} from './character-draft.dto'

const MAX_PORTRAIT_BYTES = 2 * 1024 * 1024

interface PortraitRequest extends AsyncIterable<Buffer> {
  readonly user?: { readonly id?: unknown }
  readonly headers: {
    readonly ['content-type']?: string
  }
}

function ownerId(request: PortraitRequest): string {
  try {
    return parseCharacterDraftOwnerId(request.user?.id)
  } catch {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }
}

function detectedMimeType(bytes: Buffer): string | null {
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  ) return 'image/png'

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) return 'image/jpeg'

  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
    bytes.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return 'image/webp'

  return null
}

async function readLimitedBody(
  request: PortraitRequest,
): Promise<Buffer> {
  const chunks: Buffer[] = []
  let size = 0

  for await (const value of request) {
    const chunk = Buffer.isBuffer(value)
      ? value
      : Buffer.from(value)
    size += chunk.byteLength
    if (size > MAX_PORTRAIT_BYTES) {
      throw new PayloadTooLargeException({
        code: 'CHARACTER_PORTRAIT_TOO_LARGE',
        maximumBytes: MAX_PORTRAIT_BYTES,
      })
    }
    chunks.push(chunk)
  }

  if (size === 0) {
    throw new BadRequestException({
      code: 'CHARACTER_PORTRAIT_EMPTY',
    })
  }

  return Buffer.concat(chunks, size)
}

@Controller('characters')
export class CharacterPortraitController {
  constructor(private readonly database: DatabaseService) {}

  private async assertOwned(
    authenticatedOwnerId: string,
    characterId: string,
  ): Promise<void> {
    const character = await this.database.character.findFirst({
      where: { id: characterId, ownerId: authenticatedOwnerId },
      select: { id: true },
    })

    if (character === null) {
      throw new NotFoundException({
        code: 'CHARACTER_DRAFT_NOT_FOUND',
      })
    }
  }

  @Get(':characterId/portrait')
  async load(
    @Req() request: PortraitRequest,
    @Param('characterId') characterIdInput: unknown,
  ): Promise<StreamableFile> {
    const authenticatedOwnerId = ownerId(request)
    const characterId = parseCharacterDraftIdParam(characterIdInput)
    await this.assertOwned(authenticatedOwnerId, characterId)

    const portrait = await this.database.characterPortrait.findUnique({
      where: { characterId },
    })

    if (portrait === null) {
      throw new NotFoundException({
        code: 'CHARACTER_PORTRAIT_NOT_FOUND',
      })
    }

    return new StreamableFile(Buffer.from(portrait.data), {
      type: portrait.mimeType,
      length: portrait.byteSize,
      disposition: 'inline',
    })
  }

  @Put(':characterId/portrait')
  async save(
    @Req() request: PortraitRequest,
    @Param('characterId') characterIdInput: unknown,
  ): Promise<{ mimeType: string; byteSize: number; updatedAt: string }> {
    const authenticatedOwnerId = ownerId(request)
    const characterId = parseCharacterDraftIdParam(characterIdInput)
    await this.assertOwned(authenticatedOwnerId, characterId)

    const bytes = await readLimitedBody(request)
    const portraitData = Uint8Array.from(bytes)
    const mimeType = detectedMimeType(bytes)
    const declaredMimeType = request.headers['content-type']

    if (
      mimeType === null ||
      declaredMimeType === undefined ||
      declaredMimeType.split(';', 1)[0].trim().toLowerCase() !== mimeType
    ) {
      throw new BadRequestException({
        code: 'CHARACTER_PORTRAIT_INVALID_FORMAT',
        allowed: ['image/jpeg', 'image/png', 'image/webp'],
      })
    }

    const sha256 = createHash('sha256').update(bytes).digest('hex')
    const portrait = await this.database.characterPortrait.upsert({
      where: { characterId },
      create: {
        characterId,
        mimeType,
        byteSize: bytes.byteLength,
        sha256,
        data: portraitData,
      },
      update: {
        mimeType,
        byteSize: bytes.byteLength,
        sha256,
        data: portraitData,
        updatedAt: new Date(),
      },
    })

    return {
      mimeType: portrait.mimeType,
      byteSize: portrait.byteSize,
      updatedAt: portrait.updatedAt.toISOString(),
    }
  }

  @Delete(':characterId/portrait')
  async remove(
    @Req() request: PortraitRequest,
    @Param('characterId') characterIdInput: unknown,
  ): Promise<{ removed: boolean }> {
    const authenticatedOwnerId = ownerId(request)
    const characterId = parseCharacterDraftIdParam(characterIdInput)
    await this.assertOwned(authenticatedOwnerId, characterId)

    const removed = await this.database.characterPortrait.deleteMany({
      where: { characterId },
    })

    return { removed: removed.count > 0 }
  }
}
