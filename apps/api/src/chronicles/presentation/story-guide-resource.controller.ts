import { Controller, Get, Inject, Req, Param, Query, ForbiddenException, UnauthorizedException, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'
import { CHRONICLE_PARTICIPANT_REPOSITORY } from '../application/chronicle-participant.repository'
import type { ChronicleParticipantRepository } from '../application/chronicle-participant.repository'
import { parseChronicleIdParam, parseChronicleNarratorId } from './chronicle.dto'

@Controller('chronicles/:chronicleId/guide-resources')
export class StoryGuideResourceController {
  constructor(private readonly db: DatabaseService, @Inject(CHRONICLE_PARTICIPANT_REPOSITORY) private readonly participants: ChronicleParticipantRepository) {}
  private async access(req: any, raw: unknown) {
    let ownerId: string
    try { ownerId = parseChronicleNarratorId(req.user?.id) } catch { throw new UnauthorizedException() }
    const chronicleId = parseChronicleIdParam(raw)
    const membership = await this.participants.findActiveMembership(chronicleId, ownerId)
    if (!membership || membership.role !== 'narrator') throw new ForbiddenException()
    return { ownerId, chronicleId }
  }
  private output(row: any) {
    return { id: row.id, name: row.name, kind: row.kind, summary: row.summary, narratorNotes: row.narratorNotes, status: row.status, inChronicle: row.bindings.length > 0 }
  }
  @Get()
  async list(@Req() req: any, @Param('chronicleId') raw: unknown, @Query() query: any) {
    const { ownerId, chronicleId } = await this.access(req, raw)
    const offset = Math.max(0, Math.floor(Number(query.offset) || 0))
    const rows = await this.db.libraryResource.findMany({ where: { ownerId, status: 'active' }, orderBy: [{ name: 'asc' }, { id: 'asc' }], skip: offset, take: 101, include: { bindings: { where: { chronicleId, status: 'attached' }, select: { id: true } } } })
    return { items: rows.slice(0, 100).map(row => this.output(row)), nextOffset: rows.length > 100 ? offset + 100 : null }
  }
  @Get(':resourceId')
  async detail(@Req() req: any, @Param('chronicleId') raw: unknown, @Param('resourceId') resourceRaw: unknown) {
    const { ownerId, chronicleId } = await this.access(req, raw)
    const resourceId = parseChronicleIdParam(resourceRaw)
    const row = await this.db.libraryResource.findFirst({ where: { id: resourceId, ownerId }, include: { bindings: { where: { chronicleId, status: 'attached' }, select: { id: true } } } })
    if (!row) throw new NotFoundException()
    return this.output(row)
  }
}
