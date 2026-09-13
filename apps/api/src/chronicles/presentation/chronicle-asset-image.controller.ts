import { BadRequestException, Controller, Delete, ForbiddenException, Get, Inject, NotFoundException, Param, PayloadTooLargeException, Put, Req, StreamableFile, UnauthorizedException } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { DatabaseService } from '../../database/database.service'
import { CHRONICLE_PARTICIPANT_REPOSITORY } from '../application/chronicle-participant.repository'
import type { ChronicleParticipantRepository } from '../application/chronicle-participant.repository'
import { parseChronicleIdParam, parseChronicleNarratorId } from './chronicle.dto'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024
type AssetType = 'NPC' | 'LOCATION' | 'RESOURCE' | 'SESSION'
type ImageRequest = AsyncIterable<Buffer> & { user?: { id?: unknown }; headers: { readonly ['content-type']?: string } }

function assetType(value: unknown): AssetType { if (value === 'NPC' || value === 'LOCATION' || value === 'RESOURCE' || value === 'SESSION') return value; throw new BadRequestException({ code: 'INVALID_CHRONICLE_ASSET_TYPE' }) }
function uuid(value: unknown): string { if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_ASSET_ID' }); return value }
function mime(bytes: Buffer): string | null { if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png'; if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'; if (bytes.length >= 12 && bytes.subarray(0,4).toString('ascii') === 'RIFF' && bytes.subarray(8,12).toString('ascii') === 'WEBP') return 'image/webp'; return null }
async function body(request: ImageRequest): Promise<Buffer> { const chunks: Buffer[] = []; let size = 0; for await (const value of request) { const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value); size += chunk.byteLength; if (size > MAX_IMAGE_BYTES) throw new PayloadTooLargeException({ code: 'CHRONICLE_ASSET_IMAGE_TOO_LARGE', maximumBytes: MAX_IMAGE_BYTES }); chunks.push(chunk) } if (!size) throw new BadRequestException({ code: 'CHRONICLE_ASSET_IMAGE_EMPTY' }); return Buffer.concat(chunks, size) }

@Controller('chronicles/:chronicleId/assets')
export class ChronicleAssetImageController {
  constructor(private readonly db: DatabaseService, @Inject(CHRONICLE_PARTICIPANT_REPOSITORY) private readonly participants: ChronicleParticipantRepository) {}
  private user(request: ImageRequest): string { try { return parseChronicleNarratorId(request.user?.id) } catch { throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' }) } }
  private async access(request: ImageRequest, input: unknown) { const chronicleId = parseChronicleIdParam(input); const membership = await this.participants.findActiveMembership(chronicleId, this.user(request)); if (!membership) throw new ForbiddenException({ code: 'CHRONICLE_ASSET_IMAGE_PERMISSION_DENIED' }); return { chronicleId, narrator: membership.role === 'narrator' } }
  private async target(chronicleId: string, narrator: boolean, type: AssetType, entityId: string) {
    const where = { id: entityId, chronicleId }
    const row = type === 'NPC'
      ? await this.db.chronicleNpc.findFirst({ where: { ...where, status: 'ACTIVE' }, select: { id: true } })
      : type === 'LOCATION'
        ? await this.db.chronicleLocation.findFirst({ where: { ...where, status: 'ACTIVE' }, select: { id: true } })
        : type === 'SESSION'
          ? await this.db.chronicleSession.findFirst({ where, select: { id: true } })
          : await this.db.libraryResource.findFirst({ where: { id: entityId, status: 'active', bindings: { some: { chronicleId, status: 'attached', ...(narrator ? {} : { visibility: 'chronicle_participants' }) } } }, select: { id: true } })
    if (!row) throw new NotFoundException({ code: 'CHRONICLE_ASSET_NOT_FOUND' })
  }
  @Get(':assetType/:assetId/image') async load(@Req() request: ImageRequest, @Param('chronicleId') chronicle: unknown, @Param('assetType') rawType: unknown, @Param('assetId') rawId: unknown) { const { chronicleId, narrator } = await this.access(request, chronicle); const type = assetType(rawType), entityId = uuid(rawId); await this.target(chronicleId, narrator, type, entityId); const image = await this.db.chronicleAssetImage.findUnique({ where: { assetType_entityId: { assetType: type, entityId } } }); if (!image) throw new NotFoundException({ code: 'CHRONICLE_ASSET_IMAGE_NOT_FOUND' }); return new StreamableFile(Buffer.from(image.data), { type: image.mimeType, length: image.byteSize, disposition: 'inline' }) }
  @Put(':assetType/:assetId/image') async save(@Req() request: ImageRequest, @Param('chronicleId') chronicle: unknown, @Param('assetType') rawType: unknown, @Param('assetId') rawId: unknown) { const { chronicleId, narrator } = await this.access(request, chronicle); if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_ASSET_IMAGE_PERMISSION_DENIED' }); const type = assetType(rawType), entityId = uuid(rawId); await this.target(chronicleId, narrator, type, entityId); const bytes = await body(request), detected = mime(bytes), declared = request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase(); if (!detected || declared !== detected) throw new BadRequestException({ code: 'CHRONICLE_ASSET_IMAGE_INVALID_FORMAT', allowed: ['image/jpeg', 'image/png', 'image/webp'] }); const image = await this.db.chronicleAssetImage.upsert({ where: { assetType_entityId: { assetType: type, entityId } }, create: { assetType: type, entityId, mimeType: detected, byteSize: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex'), data: Uint8Array.from(bytes) }, update: { mimeType: detected, byteSize: bytes.byteLength, sha256: createHash('sha256').update(bytes).digest('hex'), data: Uint8Array.from(bytes), updatedAt: new Date() } }); return { mimeType: image.mimeType, byteSize: image.byteSize, updatedAt: image.updatedAt.toISOString() } }
  @Delete(':assetType/:assetId/image') async remove(@Req() request: ImageRequest, @Param('chronicleId') chronicle: unknown, @Param('assetType') rawType: unknown, @Param('assetId') rawId: unknown) { const { chronicleId, narrator } = await this.access(request, chronicle); if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_ASSET_IMAGE_PERMISSION_DENIED' }); const type = assetType(rawType), entityId = uuid(rawId); await this.target(chronicleId, narrator, type, entityId); const result = await this.db.chronicleAssetImage.deleteMany({ where: { assetType: type, entityId } }); return { removed: result.count > 0 } }
}
