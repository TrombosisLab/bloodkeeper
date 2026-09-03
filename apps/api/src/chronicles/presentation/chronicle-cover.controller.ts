import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
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
  parseChronicleIdParam,
  parseChronicleNarratorId,
} from './chronicle.dto'

const MAX_COVER_BYTES = 3 * 1024 * 1024

interface CoverRequest extends AsyncIterable<Buffer> {
  readonly user?: { readonly id?: unknown }
  readonly headers: { readonly ['content-type']?: string }
}

function actorId(request: CoverRequest): string {
  try {
    return parseChronicleNarratorId(request.user?.id)
  } catch {
    throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
  }
}

function detectedMimeType(bytes: Buffer): string | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  return null
}

async function readLimitedBody(request: CoverRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const value of request) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value)
    size += chunk.byteLength
    if (size > MAX_COVER_BYTES) throw new PayloadTooLargeException({ code: 'CHRONICLE_COVER_TOO_LARGE', maximumBytes: MAX_COVER_BYTES })
    chunks.push(chunk)
  }
  if (size === 0) throw new BadRequestException({ code: 'CHRONICLE_COVER_EMPTY' })
  return Buffer.concat(chunks, size)
}

@Controller('chronicles/:chronicleId/cover')
export class ChronicleCoverController {
  constructor(private readonly database: DatabaseService) {}

  private async membership(request: CoverRequest, chronicleInput: unknown) {
    const userId = actorId(request)
    const chronicleId = parseChronicleIdParam(chronicleInput)
    const membership = await this.database.chronicleParticipant.findFirst({
      where: { chronicleId, userId, status: 'ACTIVE' },
      select: { role: true },
    })
    if (membership === null) throw new NotFoundException({ code: 'CHRONICLE_NOT_FOUND' })
    return { chronicleId, role: membership.role }
  }

  private async narrator(request: CoverRequest, chronicleInput: unknown): Promise<string> {
    const access = await this.membership(request, chronicleInput)
    if (access.role !== 'NARRATOR') throw new ForbiddenException({ code: 'CHRONICLE_COVER_PERMISSION_DENIED' })
    return access.chronicleId
  }

  @Get()
  async load(@Req() request: CoverRequest, @Param('chronicleId') chronicleInput: unknown): Promise<StreamableFile> {
    const { chronicleId } = await this.membership(request, chronicleInput)
    const cover = await this.database.chronicleCoverImage.findUnique({ where: { chronicleId } })
    if (cover === null) throw new NotFoundException({ code: 'CHRONICLE_COVER_NOT_FOUND' })
    return new StreamableFile(Buffer.from(cover.data), { type: cover.mimeType, length: cover.byteSize, disposition: 'inline' })
  }

  @Put()
  async save(@Req() request: CoverRequest, @Param('chronicleId') chronicleInput: unknown) {
    const chronicleId = await this.narrator(request, chronicleInput)
    const bytes = await readLimitedBody(request)
    const mimeType = detectedMimeType(bytes)
    const declared = request.headers['content-type']
    if (mimeType === null || declared === undefined || declared.split(';', 1)[0].trim().toLowerCase() !== mimeType) {
      throw new BadRequestException({ code: 'CHRONICLE_COVER_INVALID_FORMAT', allowed: ['image/jpeg', 'image/png', 'image/webp'] })
    }
    const cover = await this.database.chronicleCoverImage.upsert({
      where: { chronicleId },
      create: { chronicleId, mimeType, byteSize: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex'), data: Uint8Array.from(bytes) },
      update: { mimeType, byteSize: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex'), data: Uint8Array.from(bytes), updatedAt: new Date() },
    })
    return { mimeType: cover.mimeType, byteSize: cover.byteSize, updatedAt: cover.updatedAt.toISOString() }
  }

  @Delete()
  async remove(@Req() request: CoverRequest, @Param('chronicleId') chronicleInput: unknown) {
    const chronicleId = await this.narrator(request, chronicleInput)
    const removed = await this.database.chronicleCoverImage.deleteMany({ where: { chronicleId } })
    return { removed: removed.count > 0 }
  }
}
