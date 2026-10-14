import { Controller, Get, Put, Inject, Req, Param, Body, Header, BadRequestException, ForbiddenException, UnauthorizedException, ConflictException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { DatabaseService } from '../../database/database.service'
import { CHRONICLE_PARTICIPANT_REPOSITORY } from '../application/chronicle-participant.repository'
import type { ChronicleParticipantRepository } from '../application/chronicle-participant.repository'
import { parseChronicleIdParam, parseChronicleNarratorId } from './chronicle.dto'
import { emptyBackdrop, parseBackdrop } from '../domain/chronicle-backdrop'
import type { BackdropState } from '../domain/chronicle-backdrop'

@Controller('chronicles/:chronicleId/backdrop')
export class ChronicleBackdropController {
  constructor(private readonly db: DatabaseService, @Inject(CHRONICLE_PARTICIPANT_REPOSITORY) private readonly participants: ChronicleParticipantRepository) {}
  private async access(req: { user?: { id?: unknown } }, raw: unknown) {
    let userId: string
    try { userId = parseChronicleNarratorId(req.user?.id) } catch { throw new UnauthorizedException() }
    let chronicleId: string
    try { chronicleId = parseChronicleIdParam(raw) } catch { throw new BadRequestException('Crónica no válida.') }
    const membership = await this.participants.findActiveMembership(chronicleId, userId)
    const chronicle = await this.db.chronicle.findUnique({ where: { id: chronicleId }, select: { narratorId: true } })
    if (!membership || membership.role !== 'narrator' || chronicle?.narratorId !== userId) throw new ForbiddenException()
    return { userId, chronicleId }
  }
  @Get()
  @Header('Cache-Control', 'no-store')
  async read(@Req() req: { user?: { id?: unknown } }, @Param('chronicleId') raw: unknown) {
    const { chronicleId } = await this.access(req, raw)
    const row = await this.db.chronicleBackdrop.findUnique({ where: { chronicleId } })
    return row ? { state: row.state, revision: row.revision } : { state: emptyBackdrop(), revision: 0 }
  }
  @Get('references')
  @Header('Cache-Control', 'no-store')
  async references(@Req() req: { user?: { id?: unknown } }, @Param('chronicleId') raw: unknown) {
    const { chronicleId, userId } = await this.access(req, raw)
    const [stories, library, resources] = await Promise.all([
      this.db.chronicleStory.findMany({ where: { chronicleId }, select: { id: true, title: true, narratorGuide: true }, orderBy: { title: 'asc' }, take: 201 }),
      this.db.libraryResource.findMany({ where: { ownerId: userId, status: 'active' }, select: { id: true, name: true, bindings: { where: { chronicleId, status: 'attached' }, select: { id: true } } }, orderBy: { name: 'asc' }, take: 1001 }),
      this.db.chronicleResource.findMany({ where: { chronicleId, status: 'active' }, select: { id: true, name: true }, orderBy: { name: 'asc' }, take: 1001 }),
    ])
    if (stories.length > 200 || library.length > 1000 || resources.length > 1000) throw new BadRequestException('El catálogo supera el límite de esta versión; no se muestra una lista incompleta.')
    return { items: [
      ...stories.flatMap(s => {
        const cards = (s.narratorGuide as { cards?: { id: string; title: string }[] } | null)?.cards ?? []
        return [{ kind: 'story', id: s.id, label: 'Historia · ' + s.title }, ...cards.map(c => ({ kind: 'card', id: s.id, cardId: c.id, label: 'Guion · ' + s.title + ' / ' + c.title }))]
      }),
      ...library.map(r => ({ kind: 'library', id: r.id, label: (r.bindings.length ? 'Recurso de la crónica · ' : 'Biblioteca · ') + r.name })),
      ...resources.map(r => ({ kind: 'resource', id: r.id, label: 'Recurso de la crónica · ' + r.name })),
    ] }
  }
  private async validateReferences(state: BackdropState, chronicleId: string, userId: string) {
    const unique = new Map(state.notes.flatMap(n => n.references).map(r => [JSON.stringify(r), r]))
    const refs = [...unique.values()]
    const [stories, library, resources] = await Promise.all([
      this.db.chronicleStory.findMany({ where: { chronicleId, id: { in: refs.filter(r => r.kind === 'story' || r.kind === 'card').map(r => r.id) } }, select: { id: true, narratorGuide: true } }),
      this.db.libraryResource.findMany({ where: { ownerId: userId, id: { in: refs.filter(r => r.kind === 'library').map(r => r.id) } }, select: { id: true } }),
      this.db.chronicleResource.findMany({ where: { chronicleId, id: { in: refs.filter(r => r.kind === 'resource').map(r => r.id) } }, select: { id: true } }),
    ])
    for (const ref of unique.values()) {
      let allowed = false
      if (ref.kind === 'story' || ref.kind === 'card') {
        const story = stories.find(s => s.id === ref.id)
        allowed = !!story && (ref.kind === 'story' || !!(story.narratorGuide as { cards?: { id: string }[] } | null)?.cards?.some(c => c.id === ref.cardId))
      } else if (ref.kind === 'library') allowed = library.some(r => r.id === ref.id)
      else allowed = resources.some(r => r.id === ref.id)
      if (!allowed) throw new BadRequestException('Hay una referencia eliminada o no autorizada. Retírala antes de guardar.')
    }
  }
  @Put()
  @Header('Cache-Control', 'no-store')
  async save(@Req() req: { user?: { id?: unknown } }, @Param('chronicleId') raw: unknown, @Body() body: { state?: unknown; expectedRevision?: unknown }) {
    const { chronicleId, userId } = await this.access(req, raw)
    let state: BackdropState
    try { state = parseBackdrop(body?.state) } catch (e) { throw new BadRequestException(e instanceof Error ? e.message : 'Pizarra no válida.') }
    const revision = body?.expectedRevision
    if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0) throw new BadRequestException('Revisión no válida.')
    await this.validateReferences(state, chronicleId, userId)
    const data = state as unknown as Prisma.InputJsonValue
    if (revision === 0) {
      try { await this.db.chronicleBackdrop.create({ data: { chronicleId, state: data } }) }
      catch (e) { if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException('Otra pestaña ha guardado cambios.'); throw e }
    } else {
      const updated = await this.db.chronicleBackdrop.updateMany({ where: { chronicleId, revision }, data: { state: data, revision: { increment: 1 } } })
      if (updated.count !== 1) throw new ConflictException('Otra pestaña ha guardado cambios. Conserva tu borrador y revisa la versión actual.')
    }
    return { state, revision: revision + 1 }
  }
}
