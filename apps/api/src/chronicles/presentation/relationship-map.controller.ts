import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Req, UnauthorizedException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { DatabaseService } from '../../database/database.service'
import { emptyRelationMap, parseRelationMap, publishRelationCard, removeRelationCard } from '../domain/relationship-map'
type Request = { user?: { id?: string } }
const sharedSelect = { userId: true, sharedMap: true, revision: true, updatedAt: true }

@Controller('chronicles/:chronicleId/relationships')
export class RelationshipMapController {
  constructor(private readonly database: DatabaseService) {}
  private async access(chronicleId: string, req: Request) {
    const userId = req.user?.id
    if (!userId) throw new UnauthorizedException()
    const db = this.database as any
    const chronicle = await db.chronicle.findUnique({ where: { id: chronicleId }, select: { narratorId: true, participants: { where: { status: 'ACTIVE' }, select: { userId: true } } } })
    const members: string[] = chronicle ? [...new Set<string>([chronicle.narratorId, ...chronicle.participants.map((p: any) => p.userId)])] : []
    if (!members.includes(userId)) throw new ForbiddenException('No tienes acceso a esta crónica.')
    return { db, userId, members }
  }
  private own(row: any, userId: string) { return { ownerId: userId, revision: row?.revision ?? 0, privateMap: row?.privateMap ?? emptyRelationMap(), sharedMap: row?.sharedMap ?? emptyRelationMap() } }
  private body(value: unknown, fields: string[]) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !fields.includes(k))) throw new BadRequestException('Petición inválida.')
    const body = value as Record<string, any>
    if (!Number.isInteger(body.revision) || body.revision < 0 || body.revision > 1000000) throw new BadRequestException('Revisión inválida.')
    return body
  }
  private async mutate(chronicleId: string, req: Request, revision: number, change: (row: any) => any) {
    const { db, userId } = await this.access(chronicleId, req)
    const where = { chronicleId_userId: { chronicleId, userId } }
    const row = await db.chronicleRelationshipMap.findUnique({ where })
    if ((row?.revision ?? 0) !== revision) throw new ConflictException('El mapa cambió. Conserva tu borrador y recarga antes de guardar.')
    let next: any
    try { next = change(this.own(row, userId)) } catch (e) { throw new BadRequestException(e instanceof Error ? e.message : 'Mapa inválido.') }
    if (!row) {
      try { return this.own(await db.chronicleRelationshipMap.create({ data: { chronicleId, userId, ...next, revision: 1 } }), userId) }
      catch (e: any) { if (e?.code === 'P2002') throw new ConflictException('El mapa cambió. Recarga antes de guardar.'); throw e }
    }
    const updated = await db.chronicleRelationshipMap.updateMany({ where: { chronicleId, userId, revision }, data: { ...next, revision: { increment: 1 } } })
    if (updated.count !== 1) throw new ConflictException('El mapa cambió. Recarga antes de guardar.')
    return this.own(await db.chronicleRelationshipMap.findUnique({ where }), userId)
  }
  @Get('me')
  async me(@Param('chronicleId', ParseUUIDPipe) chronicleId: string, @Req() req: Request) {
    const { db, userId } = await this.access(chronicleId, req)
    return this.own(await db.chronicleRelationshipMap.findUnique({ where: { chronicleId_userId: { chronicleId, userId } } }), userId)
  }
  @Get('shared')
  async list(@Param('chronicleId', ParseUUIDPipe) chronicleId: string, @Req() req: Request) {
    const { db, members } = await this.access(chronicleId, req)
    const rows = await db.chronicleRelationshipMap.findMany({ where: { chronicleId, userId: { in: members } }, select: { userId: true, sharedMap: true, user: { select: { displayName: true } } } })
    return rows.filter((r: any) => Array.isArray(r.sharedMap?.cards) && r.sharedMap.cards.length > 0).map((r: any) => ({ ownerId: r.userId, name: r.user.displayName }))
  }
  @Get('shared/:ownerId')
  async shared(@Param('chronicleId', ParseUUIDPipe) chronicleId: string, @Param('ownerId', ParseUUIDPipe) ownerId: string, @Req() req: Request) {
    const { db, members } = await this.access(chronicleId, req)
    if (!members.includes(ownerId)) throw new ForbiddenException('Este mapa no está disponible.')
    // Never select or serialize another person's privateMap, including for narrators/admins.
    const row = await db.chronicleRelationshipMap.findUnique({ where: { chronicleId_userId: { chronicleId, userId: ownerId } }, select: sharedSelect })
    return { ownerId, map: row?.sharedMap ?? emptyRelationMap(), revision: row?.revision ?? 0 }
  }
  @Patch('me/:scope')
  async save(@Param('chronicleId', ParseUUIDPipe) chronicleId: string, @Param('scope') scope: string, @Req() req: Request, @Body() value: unknown) {
    if (scope !== 'private' && scope !== 'shared') throw new BadRequestException('Mapa inválido.')
    const body = this.body(value, ['revision','map'])
    return this.mutate(chronicleId, req, body.revision, row => {
      const map = parseRelationMap(body.map, scope === 'shared')
      if (scope === 'shared') {
        // Publication provenance is server-controlled; clients cannot forge links to private cards.
        for (const c of map.cards) if (c.sourceId && !row.sharedMap.cards.some((old: any) => old.id === c.id && old.sourceId === c.sourceId)) throw new Error('Origen de publicación inválido.')
        for (const old of row.sharedMap.cards) if (old.sourceId && map.cards.some(c => c.id === old.id && c.sourceId !== old.sourceId)) throw new Error('No se puede cambiar el origen de publicación.')
        return { privateMap: row.privateMap, sharedMap: map }
      }
      let sharedMap = row.sharedMap
      for (const c of sharedMap.cards) if (c.sourceId && !map.cards.some(p => p.id === c.sourceId)) sharedMap = removeRelationCard(sharedMap, c.id)
      return { privateMap: map, sharedMap }
    })
  }
  @Post('me/publication')
  async publication(@Param('chronicleId', ParseUUIDPipe) chronicleId: string, @Req() req: Request, @Body() value: unknown) {
    const body = this.body(value, ['revision','cardId','visible'])
    if (typeof body.cardId !== 'string' || typeof body.visible !== 'boolean') throw new BadRequestException('Publicación inválida.')
    return this.mutate(chronicleId, req, body.revision, row => {
      if (!row.privateMap.cards.some((c: any) => c.id === body.cardId)) throw new Error('Tarjeta privada no disponible.')
      const publicCard = row.sharedMap.cards.find((c: any) => c.sourceId === body.cardId)
      const sharedMap = body.visible ? publishRelationCard(row.privateMap, row.sharedMap, body.cardId, randomUUID())
        : publicCard ? removeRelationCard(row.sharedMap, publicCard.id) : row.sharedMap
      return { privateMap: row.privateMap, sharedMap }
    })
  }
}
