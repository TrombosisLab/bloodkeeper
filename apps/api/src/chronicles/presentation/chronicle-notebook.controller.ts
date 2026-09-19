import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Delete,
  Req,
  UnauthorizedException,
} from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'

type RequestWithUser = { user?: { id?: unknown; roles?: unknown } }
type NoteInput = { title?: unknown; content?: unknown; visibility?: unknown; sessionId?: unknown; pinned?: unknown; references?: unknown; audienceUserIds?: unknown; tags?: unknown; contextLocationId?: unknown; contextImageTargetType?: unknown; contextImageTargetId?: unknown }
const targetTypes = new Set(['CHARACTER', 'NPC', 'LOCATION', 'EVENT', 'STORY', 'SESSION', 'RESOURCE', 'ORGANIZATION', 'ARTIFACT', 'DOCUMENT'])

function actor(request: RequestWithUser): string {
  if (typeof request.user?.id !== 'string' || request.user.id.length === 0) throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
  return request.user.id
}
function text(value: unknown, field: string, required = false): string | null {
  if (value === undefined || value === null || value === '') {
    if (required) throw new BadRequestException({ code: 'INVALID_NOTE_REQUEST', message: field + ' es obligatorio' })
    return null
  }
  if (typeof value !== 'string' || value.length > 20000) throw new BadRequestException({ code: 'INVALID_NOTE_REQUEST', message: field + ' no es válido' })
  const result = value.trim()
  if (required && !result) throw new BadRequestException({ code: 'INVALID_NOTE_REQUEST', message: field + ' es obligatorio' })
  return result
}
function visibility(value: unknown): 'PRIVATE' | 'CHRONICLE' | 'SELECTED_PLAYERS' {
  if (value === undefined || value === null || value === '') return 'CHRONICLE'
  if (value === 'PRIVATE' || value === 'CHRONICLE' || value === 'SELECTED_PLAYERS') return value
  throw new BadRequestException({ code: 'INVALID_NOTE_VISIBILITY' })
}
function references(value: unknown): Array<{ targetType: string; targetId: string; label?: string }> {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.length > 40) throw new BadRequestException({ code: 'INVALID_NOTE_REFERENCES' })
  return value.map((item) => {
    if (!item || typeof item !== 'object') throw new BadRequestException({ code: 'INVALID_NOTE_REFERENCES' })
    const row = item as Record<string, unknown>
    const targetType = text(row.targetType, 'references.targetType', true)!.toUpperCase()
    const targetId = text(row.targetId, 'references.targetId', true)!
    if (!targetTypes.has(targetType)) throw new BadRequestException({ code: 'INVALID_NOTE_REFERENCE_TYPE' })
    return { targetType, targetId, label: text(row.label, 'references.label') ?? undefined }
  })
}
function contentReferences(value: string): Array<{ targetType: string; targetId: string }> {
  const result: Array<{ targetType: string; targetId: string }> = []
  const pattern = /@\[[^\]]+\]\(([A-Z_]+):([^\)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(value)) !== null) {
    const targetType = match[1]!.toUpperCase()
    const targetId = match[2]!
    if (targetTypes.has(targetType) && targetId) result.push({ targetType, targetId })
  }
  return result
}

function noteTags(value: unknown): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.length > 12) throw new BadRequestException({ code: 'INVALID_NOTE_TAGS' })
  const normalized = value.map((item) => {
    if (typeof item !== 'string') throw new BadRequestException({ code: 'INVALID_NOTE_TAGS' })
    const tag = item.trim().replace(/^#/, '')
    if (!tag || tag.length > 32) throw new BadRequestException({ code: 'INVALID_NOTE_TAGS' })
    return tag
  })
  return [...new Set(normalized)]
}
function contextLocationId(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) throw new BadRequestException({ code: 'INVALID_NOTE_CONTEXT_LOCATION' })
  return value
}

function contextImageTargetType(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !/^(NPC|LOCATION|RESOURCE|ORGANIZATION|ARTIFACT|DOCUMENT|SESSION)$/i.test(value)) throw new BadRequestException({ code: 'INVALID_NOTE_CONTEXT_IMAGE_TARGET_TYPE' })
  return value.toUpperCase()
}

function contextImageTargetId(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) throw new BadRequestException({ code: 'INVALID_NOTE_CONTEXT_IMAGE_TARGET_ID' })
  return value
}

function contextLocationReferences(value: string): Array<{ targetType: string; targetId: string }> {
  const result: Array<{ targetType: string; targetId: string }> = []
  const pattern = /@\[[^\]]+\]\(LOCATION:([^\)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(value)) !== null) result.push({ targetType: 'LOCATION', targetId: match[1]! })
  return result
}

function audience(value: unknown): string[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string') || value.length > 50) throw new BadRequestException({ code: 'INVALID_NOTE_AUDIENCE' })
  return [...new Set(value as string[])]
}

@Controller('chronicles/:chronicleId/notebook')
export class ChronicleNotebookController {
  constructor(private readonly database: DatabaseService) {}

  private async access(chronicleId: string, userId: string) {
    const db = this.database as any
    const chronicle = await db.chronicle.findUnique({ where: { id: chronicleId }, select: { id: true, narratorId: true, participants: { where: { userId, status: 'ACTIVE' }, select: { userId: true } } } })
    if (!chronicle) throw new NotFoundException({ code: 'CHRONICLE_NOT_FOUND' })
    const narrator = chronicle.narratorId === userId
    if (!narrator && chronicle.participants.length === 0) throw new ForbiddenException({ code: 'CHRONICLE_NOTE_PERMISSION_DENIED' })
    return { db, narrator }
  }

  private whereVisible(userId: string, narrator: boolean, chronicleId: string, sessionId?: string) {
    return { chronicleId, status: 'ACTIVE', ...(sessionId ? { sessionId } : {}), OR: [{ authorUserId: userId }, { visibility: 'CHRONICLE' }, { visibility: 'SELECTED_PLAYERS', ...(narrator ? {} : { audiences: { some: { userId } } }) }] }
  }

  @Get()
  async list(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string) {
    const userId = actor(request)
    const { db, narrator } = await this.access(chronicleId, userId)
    const notes = await db.chronicleNote.findMany({ where: this.whereVisible(userId, narrator, chronicleId), orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }], include: { favorites: { where: { userId }, select: { userId: true } }, references: true, audiences: { select: { userId: true } }, author: { select: { id: true, displayName: true, username: true } }, session: { select: { id: true, title: true, sessionNumber: true } } } })
    return { items: notes.map((note: any) => this.present(note, narrator, userId)).sort((a: any, b: any) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), canManage: narrator, viewerUserId: userId }
  }

  @Get('context')
  async context(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string) {
    const userId = actor(request)
    const { db, narrator } = await this.access(chronicleId, userId)
    const [npcs, locations, resources, participants, characters] = await Promise.all([
      db.chronicleNpc.findMany({
        where: { chronicleId, status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, category: true, description: true, narrativeRole: true, detailLevel: true },
      }),
      db.chronicleLocation.findMany({
        where: { chronicleId, status: 'ACTIVE' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, category: true, description: true, parentLocationId: true },
      }),
      db.libraryResource.findMany({
        where: { status: 'active', kind: { in: ['document', 'artifact', 'organization'] }, bindings: { some: { chronicleId, status: 'attached', ...(narrator ? {} : { visibility: 'chronicle_participants' }) } } },
        orderBy: { name: 'asc' },
        select: { id: true, kind: true, name: true, summary: true, metadata: true, bindings: { where: { chronicleId }, select: { visibility: true }, take: 1 } },
      }),
      db.chronicleParticipant.findMany({
        where: { chronicleId, status: 'ACTIVE', role: 'PLAYER' },
        select: { user: { select: { id: true, displayName: true, username: true } } },
      }),
      db.character.findMany({
        where: { chronicleId, status: 'ACTIVE' },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, ownerId: true, status: true, identity: { select: { name: true, concept: true } } },
      }),
    ])
    const sharedResources = resources.map((resource: any) => ({
      id: resource.id,
      kind: String(resource.kind).toUpperCase(),
      name: resource.name,
      summary: resource.summary,
      visibility: resource.bindings[0]?.visibility === 'chronicle_participants' ? 'chronicle_participants' : 'narrator_only',
      locationId: resource.metadata && typeof resource.metadata === 'object' && typeof resource.metadata.locationId === 'string' ? resource.metadata.locationId : null,
    }))
    const locationImageIds = new Set((await db.chronicleAssetImage.findMany({ where: { assetType: 'LOCATION', entityId: { in: locations.map((location: any) => location.id) } }, select: { entityId: true } })).map((row: any) => String(row.entityId)))
    const contextImageRows = await db.chronicleAssetImage.findMany({ where: { assetType: { in: ['NPC', 'LOCATION', 'RESOURCE'] }, entityId: { in: [...npcs, ...locations, ...resources].map((item: any) => item.id) } }, select: { assetType: true, entityId: true } })
    const contextImageSet = new Set(contextImageRows.map((row: any) => row.assetType + ':' + String(row.entityId)))
    const contextImageCandidates = [
      ...npcs.filter((item: any) => contextImageSet.has('NPC:' + String(item.id))).map((item: any) => ({ targetType: 'NPC', targetId: item.id, name: item.name, imageUrl: '/api/chronicles/' + chronicleId + '/assets/NPC/' + item.id + '/image' })),
      ...locations.filter((item: any) => contextImageSet.has('LOCATION:' + String(item.id))).map((item: any) => ({ targetType: 'LOCATION', targetId: item.id, name: item.name, imageUrl: '/api/chronicles/' + chronicleId + '/assets/LOCATION/' + item.id + '/image' })),
      ...resources.filter((item: any) => contextImageSet.has('RESOURCE:' + String(item.id))).map((item: any) => ({ targetType: String(item.kind ?? 'RESOURCE').toUpperCase(), targetId: item.id, name: item.name ?? item.title ?? item.label ?? 'Recurso', imageUrl: '/api/chronicles/' + chronicleId + '/assets/RESOURCE/' + item.id + '/image' }))
    ]
    return { npcs, locations: locations.map((location: any) => ({ ...location, imageUrl: '/api/chronicles/' + chronicleId + '/assets/LOCATION/' + location.id + '/image', hasImage: locationImageIds.has(String(location.id)) })), characters: characters.map((item: any) => ({ id: String(item.id), ownerId: String(item.ownerId), status: String(item.status).toLowerCase(), name: String(item.identity?.name || 'Personaje sin nombre'), concept: item.identity?.concept ?? null })).sort((left: any, right: any) => left.name.localeCompare(right.name, 'es')), resources: sharedResources, players: participants.map((item: any) => item.user), imageCandidates: contextImageCandidates, viewerUserId: userId }
  }


  // RESOURCE_PREVIEW_DEEP_REFERENCE_V1
  // CHRONICLE_NOTE_MENTIONS_PLAYER_CHARACTERS_V1
  @Get('resource/:targetType/:targetId')
  async resourcePreview(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string, @Param('targetType') rawTargetType: string, @Param('targetId') targetId: string) {
    const userId = actor(request)
    const { db, narrator } = await this.access(chronicleId, userId)
    const targetType = rawTargetType.toUpperCase()
    if (!targetTypes.has(targetType) || !targetId) throw new BadRequestException({ code: 'INVALID_NOTE_REFERENCE' })
    const directModels: Record<string, string> = { CHARACTER: 'character', NPC: 'chronicleNpc', LOCATION: 'chronicleLocation', EVENT: 'chronicleEvent', STORY: 'chronicleStory', SESSION: 'chronicleSession' }
    const modelName = directModels[targetType]
    const model = modelName ? (db as any)[modelName] : db.libraryResource
    if (!model || typeof model.findFirst !== 'function') throw new NotFoundException({ code: 'NOTE_REFERENCE_NOT_FOUND' })
    const resourceKind = targetType === 'ORGANIZATION' ? 'organization' : targetType === 'ARTIFACT' ? 'artifact' : targetType === 'DOCUMENT' ? 'document' : null
    const row = modelName
      ? await model.findFirst({ where: { id: targetId, chronicleId } })
      : await model.findFirst({ where: { id: targetId, status: 'active', ...(resourceKind ? { kind: resourceKind } : {}), bindings: { some: { chronicleId, status: 'attached', ...(narrator ? {} : { visibility: 'chronicle_participants' }) } } } })
    const characterIdentity = targetType === 'CHARACTER' ? await db.characterIdentity.findUnique({ where: { characterId: targetId }, select: { name: true, concept: true } }) : null
    if (!row) throw new NotFoundException({ code: 'NOTE_REFERENCE_NOT_FOUND' })
    const imageType = targetType === 'NPC' || targetType === 'LOCATION' ? targetType : 'RESOURCE'
    const image = await db.chronicleAssetImage.findUnique({ where: { assetType_entityId: { assetType: imageType, entityId: targetId } }, select: { updatedAt: true } })
    const label = characterIdentity?.name ?? row.name ?? row.title ?? row.alias ?? row.label ?? 'Recurso'
    const description = characterIdentity?.concept ?? row.description ?? row.summary ?? row.premise ?? row.objective ?? null
    const category = row.category ?? row.type ?? row.kind ?? targetType
    return {
      id: String(row.id),
      targetType,
      targetId,
      label: String(label),
      category: String(category),
      status: String(row.status ?? 'ACTIVE'),
      description: typeof description === 'string' ? description : null,
      narrativeRole: row.narrativeRole ?? row.role ?? null,
      detailLevel: row.detailLevel ?? null,
      metrics: { appearances: null, histories: null },
      narratorDetails: narrator ? (row.narratorNotes ?? row.notes ?? null) : null,
      deepProfile: narrator && targetType === 'NPC' ? row.deepProfile ?? null : null,
      metadata: narrator ? row.metadata ?? null : null,
      canViewPrivateDetails: narrator,
      sessionDate: targetType === 'SESSION' ? row.realDate ?? null : null,
      sessionNumber: targetType === 'SESSION' ? row.sessionNumber ?? null : null,
      parentLocationId: targetType === 'LOCATION' ? row.parentLocationId ?? null : null,
      imageUrl: image ? '/api/chronicles/' + chronicleId + '/assets/' + imageType + '/' + targetId + '/image?v=' + image.updatedAt.getTime() : null,
      privateNotice: 'La información privada del Narrador no se muestra a los jugadores.'
    }
  }

  @Get(':noteId')
  async get(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string, @Param('noteId') noteId: string) {
    const userId = actor(request)
    const { db, narrator } = await this.access(chronicleId, userId)
    const note = await db.chronicleNote.findFirst({ where: { id: noteId, ...this.whereVisible(userId, narrator, chronicleId) }, include: { favorites: { where: { userId }, select: { userId: true } }, references: true, audiences: { select: { userId: true } }, author: { select: { id: true, displayName: true, username: true } }, session: { select: { id: true, title: true, sessionNumber: true } } } })
    if (!note) throw new NotFoundException({ code: 'CHRONICLE_NOTE_NOT_FOUND' })
    return this.present(note, narrator, userId)
  }

  @Post(':noteId/pin')
  async pin(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string, @Param('noteId') noteId: string, @Body() body: { pinned?: unknown }) {
    const userId = actor(request)
    const { db, narrator } = await this.access(chronicleId, userId)
    if (typeof body?.pinned !== 'boolean') throw new BadRequestException({ code: 'INVALID_NOTE_PIN' })
    const note = await db.chronicleNote.findFirst({ where: { id: noteId, ...this.whereVisible(userId, narrator, chronicleId) }, select: { id: true } })
    if (!note) throw new NotFoundException({ code: 'CHRONICLE_NOTE_NOT_FOUND' })
    if (body.pinned) await db.chronicleNoteFavorite.upsert({ where: { noteId_userId: { noteId, userId } }, create: { noteId, userId }, update: {} })
    else await db.chronicleNoteFavorite.deleteMany({ where: { noteId, userId } })
    return this.get(request, chronicleId, noteId)
  }

  @Post()
  async create(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string, @Body() body: NoteInput) {
    const userId = actor(request)
    const { db, narrator } = await this.access(chronicleId, userId)
    const title = text(body?.title, 'title', true)!
    const content = text(body?.content, 'content', true)!
    const noteVisibility = visibility(body?.visibility)
    const sessionId = text(body?.sessionId, 'sessionId')
    if (sessionId && !(await db.chronicleSession.findFirst({ where: { id: sessionId, chronicleId }, select: { id: true } }))) throw new BadRequestException({ code: 'NOTE_SESSION_OUTSIDE_CHRONICLE' })
    const refs = references(body?.references)
    const selectedContextLocationId = contextLocationId(body?.contextLocationId)
    const selectedContextImageTargetType = contextImageTargetType(body?.contextImageTargetType) || (selectedContextLocationId ? 'LOCATION' : null)
    const selectedContextImageTargetId = contextImageTargetId(body?.contextImageTargetId) || selectedContextLocationId
    await this.validateContextImageTarget(db, selectedContextImageTargetType, selectedContextImageTargetId, [...refs, ...contentReferences(content)])
    const audienceIds = audience(body?.audienceUserIds)
    if (noteVisibility === 'SELECTED_PLAYERS' && !audienceIds.length) throw new BadRequestException({ code: 'NOTE_AUDIENCE_REQUIRED', message: 'Selecciona al menos un jugador.' })
    await this.validateRelations(db, chronicleId, [...refs, ...contentReferences(content)], audienceIds, narrator && noteVisibility === 'PRIVATE')
    await this.validateContextLocation(db, chronicleId, selectedContextLocationId, [...refs, ...contextLocationReferences(content)])
    const row = await db.chronicleNote.create({ data: { chronicleId, sessionId, authorUserId: userId, contextLocationId: selectedContextLocationId, contextImageTargetType: selectedContextImageTargetType, contextImageTargetId: selectedContextImageTargetId, title, content, visibility: noteVisibility, pinned: body?.pinned === true, favorites: { create: body?.pinned === true ? [{ userId }] : [] }, tags: noteTags(body?.tags), references: { create: refs }, audiences: { create: noteVisibility === 'SELECTED_PLAYERS' ? audienceIds.map((id) => ({ userId: id })) : [] } }, include: { favorites: { where: { userId }, select: { userId: true } }, references: true, audiences: { select: { userId: true } }, author: { select: { id: true, displayName: true, username: true } }, session: { select: { id: true, title: true, sessionNumber: true } } } })
    return this.present(row, narrator, userId)
  }

  @Patch(':noteId')
  async update(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string, @Param('noteId') noteId: string, @Body() body: NoteInput) {
    const userId = actor(request)
    const { db, narrator } = await this.access(chronicleId, userId)
    const existing = await db.chronicleNote.findFirst({ where: { id: noteId, ...this.whereVisible(userId, narrator, chronicleId) }, include: { references: true } })
    if (!existing) throw new NotFoundException({ code: 'CHRONICLE_NOTE_NOT_FOUND' })
    if (!narrator && existing.authorUserId !== userId) throw new ForbiddenException({ code: 'CHRONICLE_NOTE_EDIT_DENIED' })
    const noteVisibility = body?.visibility === undefined ? existing.visibility : visibility(body.visibility)
    const contextContent = body?.content === undefined ? existing.content : text(body.content, 'content', true)!
    const selectedContextLocationId = body?.contextLocationId === undefined ? ((existing as any).contextLocationId ?? null) : contextLocationId(body.contextLocationId)
    const sessionId = body?.sessionId === undefined ? existing.sessionId : text(body.sessionId, 'sessionId')
    if (sessionId && !(await db.chronicleSession.findFirst({ where: { id: sessionId, chronicleId }, select: { id: true } }))) throw new BadRequestException({ code: 'NOTE_SESSION_OUTSIDE_CHRONICLE' })
    const content = body?.content === undefined ? existing.content : text(body.content, 'content', true)!
    const embeddedRefs = contentReferences(content)
    const existingRefs = Array.isArray((existing as any).references) ? (existing as any).references : []
    const refs = body?.references === undefined ? null : references(body.references)
    const selectedContextImageTargetType = contextImageTargetType(body?.contextImageTargetType) || (selectedContextLocationId ? 'LOCATION' : null)
    const selectedContextImageTargetId = contextImageTargetId(body?.contextImageTargetId) || selectedContextLocationId
    const contextImageReferences = [...(refs ?? existingRefs), ...embeddedRefs]
    await this.validateContextImageTarget(db, selectedContextImageTargetType, selectedContextImageTargetId, contextImageReferences)
    const audienceIds = noteVisibility !== 'SELECTED_PLAYERS' ? [] : body?.audienceUserIds === undefined ? null : audience(body.audienceUserIds)
    if (noteVisibility === 'SELECTED_PLAYERS' && (body?.visibility !== undefined || audienceIds !== null)) {
      const effectiveAudience = audienceIds ?? (await db.chronicleNoteAudience.findMany({ where: { noteId }, select: { userId: true } })).map((item: any) => item.userId)
      if (!effectiveAudience.length) throw new BadRequestException({ code: 'NOTE_AUDIENCE_REQUIRED', message: 'Selecciona al menos un jugador.' })
      await this.validateRelations(db, chronicleId, [], effectiveAudience, narrator)
    }
    if (refs || audienceIds || body?.content !== undefined || body?.visibility !== undefined) await this.validateRelations(db, chronicleId, [...(refs ?? existingRefs), ...embeddedRefs], audienceIds ?? [], narrator && noteVisibility === 'PRIVATE')
    if (selectedContextLocationId && (body?.contextLocationId !== undefined || body?.content !== undefined || body?.references !== undefined)) await this.validateContextLocation(db, chronicleId, selectedContextLocationId, [...(refs ?? []), ...contextLocationReferences(contextContent), ...(((existing as any).references ?? []))])
    const row = await db.$transaction(async (tx: any) => {
      if (refs) await tx.chronicleNoteReference.deleteMany({ where: { noteId } })
      if (audienceIds) await tx.chronicleNoteAudience.deleteMany({ where: { noteId } })
      return tx.chronicleNote.update({ where: { id: noteId }, data: { ...(body?.title !== undefined ? { title: text(body.title, 'title', true) } : {}), ...(body?.content !== undefined ? { content: text(body.content, 'content', true) } : {}), visibility: noteVisibility, sessionId, contextLocationId: selectedContextLocationId, contextImageTargetType: selectedContextImageTargetType, contextImageTargetId: selectedContextImageTargetId, ...(body?.pinned !== undefined ? { pinned: body.pinned === true } : {}), ...(body?.tags !== undefined ? { tags: noteTags(body.tags) } : {}), revision: { increment: 1 }, ...(refs ? { references: { create: refs } } : {}), ...(audienceIds && noteVisibility === 'SELECTED_PLAYERS' ? { audiences: { create: audienceIds.map((id) => ({ userId: id })) } } : {}) }, include: { favorites: { where: { userId }, select: { userId: true } }, references: true, audiences: { select: { userId: true } }, author: { select: { id: true, displayName: true, username: true } }, session: { select: { id: true, title: true, sessionNumber: true } } } })
    })
    return this.present(row, narrator, userId)
  }

  @Delete(':noteId')
  async archive(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string, @Param('noteId') noteId: string) {
    const userId = actor(request)
    const { db, narrator } = await this.access(chronicleId, userId)
    const existing = await db.chronicleNote.findFirst({ where: { id: noteId, ...this.whereVisible(userId, narrator, chronicleId) }, select: { authorUserId: true } })
    if (!existing) throw new NotFoundException({ code: 'CHRONICLE_NOTE_NOT_FOUND' })
    if (!narrator && existing.authorUserId !== userId) throw new ForbiddenException({ code: 'CHRONICLE_NOTE_DELETE_DENIED' })
    await db.chronicleNote.update({ where: { id: noteId }, data: { status: 'ARCHIVED', revision: { increment: 1 } } })
    return { archived: true, id: noteId }
  }

  private async validateContextImageTarget(db: any, targetType: string | null, targetId: string | null, refs: Array<{ targetType: string; targetId: string }>) {
    if (!targetType || !targetId) return
    if (!refs.some((reference) => reference.targetType === targetType && reference.targetId === targetId)) throw new BadRequestException({ code: 'NOTE_CONTEXT_IMAGE_NOT_MENTIONED' })
    const assetType = targetType === 'NPC' || targetType === 'LOCATION' || targetType === 'SESSION' ? targetType : 'RESOURCE'
    const image = await db.chronicleAssetImage.findUnique({ where: { assetType_entityId: { assetType, entityId: targetId } }, select: { entityId: true } })
    if (!image) throw new BadRequestException({ code: 'NOTE_CONTEXT_IMAGE_NOT_AVAILABLE' })
  }

  private async validateContextLocation(db: any, chronicleId: string, contextLocationId: string | null, refs: Array<{ targetType: string; targetId: string }>) {
    if (!contextLocationId) return
    if (!refs.some((reference) => reference.targetType === 'LOCATION' && reference.targetId === contextLocationId)) throw new BadRequestException({ code: 'NOTE_CONTEXT_LOCATION_NOT_MENTIONED' })
    const location = await db.chronicleLocation.findFirst({ where: { id: contextLocationId, chronicleId, status: 'ACTIVE' }, select: { id: true } })
    if (!location) throw new BadRequestException({ code: 'NOTE_CONTEXT_LOCATION_OUTSIDE_CHRONICLE' })
  }

  private async validateRelations(db: any, chronicleId: string, refs: Array<{ targetType: string; targetId: string }>, audienceIds: string[], allowNarratorOnlyResources: boolean) {
    const directModels: Record<string, string> = { CHARACTER: 'character', NPC: 'chronicleNpc', LOCATION: 'chronicleLocation', EVENT: 'chronicleEvent', STORY: 'chronicleStory', SESSION: 'chronicleSession' }
    for (const reference of refs) {
      if (reference.targetType === 'RESOURCE' || reference.targetType === 'ORGANIZATION' || reference.targetType === 'ARTIFACT' || reference.targetType === 'DOCUMENT') {
        const resourceKind = reference.targetType === 'ORGANIZATION' ? 'organization' : reference.targetType === 'ARTIFACT' ? 'artifact' : reference.targetType === 'DOCUMENT' ? 'document' : null
        const resource = await db.libraryResource.findFirst({ where: { id: reference.targetId, status: 'active', ...(resourceKind ? { kind: resourceKind } : {}), bindings: { some: { chronicleId, status: 'attached', ...(allowNarratorOnlyResources ? {} : { visibility: 'chronicle_participants' }) } } }, select: { id: true } })
        if (!resource) throw new BadRequestException({ code: 'NOTE_REFERENCE_OUTSIDE_CHRONICLE', targetId: reference.targetId })
        continue
      }
      const modelName = directModels[reference.targetType]
      if (!modelName || !db[modelName]) throw new BadRequestException({ code: 'INVALID_NOTE_REFERENCE_TYPE' })
      const row = await db[modelName].findFirst({ where: { id: reference.targetId, chronicleId }, select: { id: true } })
      if (!row) throw new BadRequestException({ code: 'NOTE_REFERENCE_OUTSIDE_CHRONICLE', targetId: reference.targetId })
    }
    if (audienceIds.length > 0) {
      const users = await db.chronicleParticipant.findMany({ where: { chronicleId, status: 'ACTIVE', role: 'PLAYER', userId: { in: audienceIds } }, select: { userId: true } })
      if (users.length !== audienceIds.length) throw new BadRequestException({ code: 'NOTE_AUDIENCE_OUTSIDE_CHRONICLE' })
    }
  }

  private present(note: any, narrator: boolean, userId: string) {
    return { id: note.id, chronicleId: note.chronicleId, sessionId: note.sessionId, contextLocationId: note.contextLocationId ?? null, title: note.title, content: note.content, visibility: note.visibility, status: note.status, pinned: (note.favorites ?? []).some((favorite: any) => favorite.userId === userId), tags: note.tags ?? [], canEdit: narrator || note.authorUserId === userId, revision: note.revision, createdAt: note.createdAt, updatedAt: note.updatedAt, author: note.author, session: note.session, references: note.references.map((ref: any) => ({ id: ref.id, targetType: ref.targetType, targetId: ref.targetId, label: ref.label })), audienceUserIds: narrator || note.authorUserId === userId ? note.audiences.map((row: any) => row.userId) : [] }
  }
}
