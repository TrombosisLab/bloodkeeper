import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Inject, NotFoundException, Param, Patch, Post, Query, Req, UnauthorizedException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'
import { CHRONICLE_PARTICIPANT_REPOSITORY } from '../application/chronicle-participant.repository'
import type { ChronicleParticipantRepository } from '../application/chronicle-participant.repository'
import { parseChronicleIdParam, parseChronicleNarratorId } from './chronicle.dto'

type Kind = 'npc' | 'location' | 'document' | 'artifact' | 'organization'
type Visibility = 'narrator_only' | 'chronicle_participants'

function kind(value: unknown): Kind {
  if (value === 'npc' || value === 'location' || value === 'document' || value === 'artifact' || value === 'organization') return value
  throw new BadRequestException({ code: 'INVALID_CHRONICLE_RESOURCE_KIND' })
}
function visibility(value: unknown): Visibility {
  if (value === 'narrator_only' || value === 'chronicle_participants') return value
  throw new BadRequestException({ code: 'INVALID_CHRONICLE_RESOURCE_VISIBILITY' })
}
function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_RESOURCE_ID' })
  return value
}
function payload(value: unknown, partial = false) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_RESOURCE_REQUEST' })
  const input = value as Record<string, unknown>
  const allowed = ['kind', 'name', 'summary', 'narratorNotes', 'visibility', 'metadata']
  if (Object.keys(input).some((key) => !allowed.includes(key))) throw new BadRequestException({ code: 'INVALID_CHRONICLE_RESOURCE_REQUEST' })
  const output: Record<string, unknown> = {}
  if (!partial || input.kind !== undefined) output.kind = kind(input.kind)
  if (!partial || input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim().length < 1 || input.name.trim().length > 160) throw new BadRequestException({ code: 'INVALID_CHRONICLE_RESOURCE_REQUEST' })
    output.name = input.name.trim()
  }
  for (const key of ['summary', 'narratorNotes'] as const) {
    if (input[key] !== undefined) {
      if (input[key] !== null && typeof input[key] !== 'string') throw new BadRequestException({ code: 'INVALID_CHRONICLE_RESOURCE_REQUEST' })
      output[key] = typeof input[key] === 'string' && input[key].trim() ? input[key].trim() : null
    }
  }
  if (!partial || input.visibility !== undefined) output.visibility = visibility(input.visibility ?? 'narrator_only')
  if (input.metadata !== undefined) output.metadata = input.metadata
  return output as { kind?: Kind; name?: string; summary?: string | null; narratorNotes?: string | null; visibility?: Visibility; metadata?: unknown }
}
function response(resource: any, binding: any) {
  return {
    id: resource.id,
    chronicleId: binding?.chronicleId ?? null,
    kind: String(resource.kind).toLowerCase(),
    name: resource.name,
    summary: resource.summary,
    narratorNotes: resource.narratorNotes,
    visibility: binding?.visibility === 'chronicle_participants' ? 'chronicle_participants' : 'narrator_only',
    metadata: resource.metadata,
    locationId: resource.metadata && typeof resource.metadata === 'object' && typeof resource.metadata.locationId === 'string' ? resource.metadata.locationId : null,
    status: binding?.status === 'archived' || resource.status === 'archived' ? 'archived' : 'active',
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
  }
}

@Controller('chronicles/:chronicleId/resources')
export class ChronicleResourceController {
  constructor(
    private readonly db: DatabaseService,
    @Inject(CHRONICLE_PARTICIPANT_REPOSITORY) private readonly participants: ChronicleParticipantRepository,
  ) {}

  private actor(req: any): string {
    try { return parseChronicleNarratorId(req.user?.id) } catch { throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' }) }
  }
  private async access(req: any, value: unknown): Promise<{ chronicleId: string; ownerId: string }> {
    const chronicleId = parseChronicleIdParam(value)
    const ownerId = this.actor(req)
    const membership = await this.participants.findActiveMembership(chronicleId, ownerId)
    if (!membership || membership.role !== 'narrator') throw new ForbiddenException({ code: 'CHRONICLE_RESOURCE_PERMISSION_DENIED' })
    return { chronicleId, ownerId }
  }
  private async linked(ownerId: string, chronicleId: string, resourceId?: string) {
    return this.db.libraryResource.findFirst({
      where: {
        ownerId,
        ...(resourceId ? { id: resourceId } : {}),
        status: 'active',
        bindings: { some: { chronicleId, status: { in: ['attached', 'archived'] } } },
      },
      include: { bindings: { where: { chronicleId }, take: 1 } },
    })
  }

  @Get()
  async list(@Req() req: any, @Param('chronicleId') rawChronicleId: unknown, @Query() query: Record<string, unknown>) {
    const { chronicleId, ownerId } = await this.access(req, rawChronicleId)
    const limit = Math.min(Math.max(Number(query.limit) || 25, 1), 100)
    const offset = Math.max(Number(query.offset) || 0, 0)
    const requestedStatus = query.status === 'archived' ? 'archived' : 'attached'
    const where: any = { ownerId, status: 'active', bindings: { some: { chronicleId, status: requestedStatus } } }
    if (query.kind !== undefined) where.kind = kind(query.kind)
    const rows = await this.db.libraryResource.findMany({
      where,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip: offset,
      take: limit + 1,
      include: { bindings: { where: { chronicleId }, take: 1 } },
    })
    return { items: rows.slice(0, limit).map((row: any) => response(row, row.bindings[0])), nextOffset: rows.length > limit ? offset + limit : null }
  }

  @Post()
  async create(@Req() req: any, @Param('chronicleId') rawChronicleId: unknown, @Body() body: unknown) {
    const { chronicleId, ownerId } = await this.access(req, rawChronicleId)
    const data = payload(body)
    const result = await this.db.$transaction(async (transaction) => {
      const resource = await transaction.libraryResource.create({ data: { ownerId, kind: data.kind!, name: data.name!, summary: data.summary ?? null, narratorNotes: data.narratorNotes ?? null, metadata: data.metadata as any } })
      const binding = await transaction.chronicleResourceBinding.create({ data: { chronicleId, resourceId: resource.id, visibility: data.visibility ?? 'narrator_only' } })
      return { resource, binding }
    })
    return response(result.resource, result.binding)
  }

  @Patch(':resourceId')
  async update(@Req() req: any, @Param('chronicleId') rawChronicleId: unknown, @Param('resourceId') rawResourceId: unknown, @Body() body: unknown) {
    const { chronicleId, ownerId } = await this.access(req, rawChronicleId)
    const resourceId = id(rawResourceId)
    const data = payload(body, true)
    const current = await this.linked(ownerId, chronicleId, resourceId)
    if (!current) throw new NotFoundException({ code: 'CHRONICLE_RESOURCE_NOT_FOUND' })
    const globalData: any = { ...data }
    delete globalData.visibility
    const resource = Object.keys(globalData).length > 0 ? await this.db.libraryResource.update({ where: { id: resourceId }, data: globalData }) : current
    if (data.visibility !== undefined) await this.db.chronicleResourceBinding.update({ where: { chronicleId_resourceId: { chronicleId, resourceId } }, data: { visibility: data.visibility, status: 'attached' } })
    const updated = await this.linked(ownerId, chronicleId, resourceId)
    return response(resource, updated?.bindings[0])
  }

  @Patch(':resourceId/archive')
  async archive(@Req() req: any, @Param('chronicleId') rawChronicleId: unknown, @Param('resourceId') rawResourceId: unknown) {
    const { chronicleId, ownerId } = await this.access(req, rawChronicleId)
    const resourceId = id(rawResourceId)
    const result = await this.db.chronicleResourceBinding.updateMany({ where: { chronicleId, resourceId, resource: { ownerId }, status: 'attached' }, data: { status: 'archived' } })
    if (!result.count) throw new NotFoundException({ code: 'CHRONICLE_RESOURCE_NOT_FOUND' })
    const resource = await this.linked(ownerId, chronicleId, resourceId)
    if (!resource) throw new NotFoundException({ code: 'CHRONICLE_RESOURCE_NOT_FOUND' })
    return response(resource, resource.bindings[0])
  }

  @Delete(':resourceId')
  async detach(@Req() req: any, @Param('chronicleId') rawChronicleId: unknown, @Param('resourceId') rawResourceId: unknown) {
    const { chronicleId, ownerId } = await this.access(req, rawChronicleId)
    const resourceId = id(rawResourceId)
    const result = await this.db.chronicleResourceBinding.deleteMany({ where: { chronicleId, resourceId, resource: { ownerId } } })
    if (!result.count) throw new NotFoundException({ code: 'CHRONICLE_RESOURCE_NOT_FOUND' })
    return { detached: true }
  }
}
