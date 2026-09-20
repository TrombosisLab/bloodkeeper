import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Req, UnauthorizedException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'

type RequestWithUser = { user?: { id?: unknown; roles?: readonly unknown[] } }
type RecordValue = Record<string, unknown>

const uuidPattern = /^[0-9a-f-]{36}$/i
const markerKinds = ['LOCATION', 'REFUGE', 'LANDMARK', 'DANGER', 'OTHER'] as const
const areaLabelHorizontals = ['left', 'center', 'right'] as const
const areaLabelVerticals = ['top', 'center', 'bottom'] as const
const areaLabelSizes = ['small', 'medium', 'large'] as const
const areaColors = ['#bd3e57', '#8f2038', '#d2693d', '#d6a72c', '#7b9e45', '#3e9b73', '#3a9ca6', '#4d83bd', '#5d6cc0', '#7b5ba7', '#b04b9b', '#a77654', '#8d8d8d', '#d7d1ca', '#fff3ed', '#2b2228'] as const
const markerSizes = ['small', 'medium', 'large'] as const
const requestStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const
type MarkerKind = typeof markerKinds[number]
type AreaLabelHorizontal = typeof areaLabelHorizontals[number]
type AreaLabelVertical = typeof areaLabelVerticals[number]
type AreaLabelSize = typeof areaLabelSizes[number]
type AreaColor = typeof areaColors[number]
type MarkerSize = typeof markerSizes[number]
type RequestStatus = typeof requestStatuses[number]

function record(value: unknown): value is RecordValue { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function id(value: unknown, code = 'INVALID_CHRONICLE_MAP_ID'): string { if (typeof value !== 'string' || !uuidPattern.test(value)) throw new BadRequestException({ code }); return value }
function text(value: unknown, field: string, maximum = 160, required = false): string | null { if (value === undefined || value === null) { if (required) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_REQUEST', message: field + ' es obligatorio' }); return null } if (typeof value !== 'string' || value.trim().length > maximum || (required && !value.trim())) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_REQUEST', message: field + ' no es válido' }); return value.trim() || null }
function coordinate(value: unknown, field: string): number { if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_COORDINATE', message: field + ' debe estar entre 0 y 1' }); return Math.round(value * 10000) / 10000 }
function geometry(value: unknown): RecordValue { if (!record(value) || value.type !== 'RECT' || typeof value.x !== 'number' || typeof value.y !== 'number' || typeof value.width !== 'number' || typeof value.height !== 'number' || value.width <= 0 || value.height <= 0 || value.x < 0 || value.y < 0 || value.x + value.width > 1 || value.y + value.height > 1) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_AREA_GEOMETRY' }); return { type: 'RECT', x: coordinate(value.x, 'geometry.x'), y: coordinate(value.y, 'geometry.y'), width: coordinate(value.width, 'geometry.width'), height: coordinate(value.height, 'geometry.height') } }
function actor(request: RequestWithUser): string { if (typeof request.user?.id !== 'string' || !uuidPattern.test(request.user.id)) throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' }); return request.user.id }
function isAdmin(request: RequestWithUser): boolean { return Array.isArray(request.user?.roles) && request.user.roles.includes('admin') }
function markerKind(value: unknown): MarkerKind { return value === undefined || value === null ? 'LOCATION' : markerKinds.includes(value as MarkerKind) ? value as MarkerKind : (() => { throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_MARKER_KIND' }) })() }
function markerSize(value: unknown): MarkerSize { return value === undefined || value === null ? 'large' : markerSizes.includes(value as MarkerSize) ? value as MarkerSize : (() => { throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_MARKER_SIZE' }) })() }
function areaColor(value: unknown, fallback: AreaColor): AreaColor { return value === undefined || value === null || value === '' ? fallback : areaColors.includes(value as AreaColor) ? value as AreaColor : (() => { throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_AREA_COLOR' }) })() }
function areaLabelSize(value: unknown): AreaLabelSize { return value === undefined || value === null ? 'medium' : areaLabelSizes.includes(value as AreaLabelSize) ? value as AreaLabelSize : (() => { throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_AREA_LABEL_SIZE' }) })() }
function areaLabelVertical(value: unknown): AreaLabelVertical { return value === undefined || value === null ? 'top' : areaLabelVerticals.includes(value as AreaLabelVertical) ? value as AreaLabelVertical : (() => { throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_AREA_LABEL_VERTICAL' }) })() }
function areaLabelHorizontal(value: unknown): AreaLabelHorizontal { return value === undefined || value === null ? 'left' : areaLabelHorizontals.includes(value as AreaLabelHorizontal) ? value as AreaLabelHorizontal : (() => { throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_AREA_LABEL_HORIZONTAL' }) })() }
function requestStatus(value: unknown): RequestStatus { return requestStatuses.includes(value as RequestStatus) ? value as RequestStatus : (() => { throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_REQUEST_STATUS' }) })() }
function resourceAssetType(value: unknown): 'NPC' | 'LOCATION' | 'RESOURCE' { return value === 'npc' ? 'NPC' : value === 'location' ? 'LOCATION' : 'RESOURCE' }

@Controller('chronicles/:chronicleId/maps')
export class ChronicleMapController {
  constructor(private readonly database: DatabaseService) {}

  private async access(chronicleId: string, request: RequestWithUser) {
    const userId = actor(request)
    const db = this.database as any
    const chronicle = await db.chronicle.findUnique({ where: { id: chronicleId }, select: { id: true, narratorId: true, participants: { where: { userId, status: 'ACTIVE' }, select: { role: true } } } })
    if (!chronicle) throw new NotFoundException({ code: 'CHRONICLE_NOT_FOUND' })
    const narrator = isAdmin(request) || chronicle.narratorId === userId || chronicle.participants.some((participant: any) => participant.role === 'narrator')
    if (!narrator && chronicle.participants.length === 0) throw new ForbiddenException({ code: 'CHRONICLE_MAP_PERMISSION_DENIED' })
    return { db, userId, narrator }
  }

  private async mapOrThrow(db: any, chronicleId: string, mapId: string, includeArchived = false) {
    const map = await db.chronicleMap.findFirst({ where: { id: mapId, chronicleId, ...(includeArchived ? {} : { status: 'ACTIVE' }) }, select: { id: true, chronicleId: true, parentMapId: true } })
    if (!map) throw new NotFoundException({ code: 'CHRONICLE_MAP_NOT_FOUND' })
    return map
  }

  private async assertParent(db: any, chronicleId: string, mapId: string | null, movingMapId?: string) {
    if (!mapId) return
    await this.mapOrThrow(db, chronicleId, mapId, true)
    let current: string | null = mapId
    for (let depth = 0; current && depth < 100; depth += 1) {
      if (current === movingMapId) throw new BadRequestException({ code: 'CHRONICLE_MAP_HIERARCHY_CYCLE' })
      const parent: { parentMapId: string | null } | null = await db.chronicleMap.findFirst({ where: { id: current, chronicleId }, select: { parentMapId: true } })
      current = parent?.parentMapId ?? null
    }
    if (current) throw new BadRequestException({ code: 'CHRONICLE_MAP_HIERARCHY_TOO_DEEP' })
  }

  private async assertResource(db: any, chronicleId: string, userId: string, resourceId: string | null) {
    if (!resourceId) return
    const resource = await db.libraryResource.findFirst({ where: { id: resourceId, ownerId: userId, status: 'active', bindings: { some: { chronicleId, status: 'attached' } } }, select: { id: true } })
    if (!resource) throw new BadRequestException({ code: 'CHRONICLE_MAP_RESOURCE_NOT_AVAILABLE' })
  }

  private presentMap(row: any, chronicleId: string, narrator: boolean) {
    const markers = (row.markers ?? []).filter((marker: any) => narrator || (marker.visibility !== 'narrator_only' && (!marker.resource || marker.resource.bindings?.some((binding: any) => binding.visibility === 'chronicle_participants')))).map((marker: any) => ({ id: marker.id, mapId: marker.mapId, resourceId: marker.resourceId, locationId: marker.locationId, kind: marker.kind, label: marker.label, x: marker.x, y: marker.y, size: marker.size ?? 'large', visibility: marker.visibility, resource: marker.resource ? { id: marker.resource.id, kind: marker.resource.kind, name: marker.resource.name, summary: marker.resource.summary, imageUrl: `/api/chronicles/${chronicleId}/assets/${resourceAssetType(marker.resource.kind)}/${marker.resource.id}/image` } : null, location: marker.location ? { id: marker.location.id, name: marker.location.name, category: marker.location.category } : null }))
    return { id: row.id, chronicleId, parentMapId: row.parentMapId, linkedLocationId: row.linkedLocationId, linkedResourceId: row.linkedResourceId, name: row.name, description: row.description, status: String(row.status).toLowerCase(), sortOrder: row.sortOrder, imageUrl: `/api/chronicles/${chronicleId}/assets/MAP/${row.id}/image`, hasImage: Boolean(row.hasImage), markers, areas: (narrator ? row.areas ?? [] : (row.areas ?? []).filter((area: any) => area.visibility !== 'narrator_only')).map((area: any) => ({ ...area, color: area.color ?? '#bd3e57', fillColor: area.fillColor ?? area.color ?? '#bd3e57', labelColor: area.labelColor ?? '#fff3ed', labelSize: area.labelSize ?? 'medium', labelVertical: area.labelVertical ?? 'top', labelHorizontal: area.labelHorizontal ?? 'left' })) }
  }

  private includes(chronicleId: string) {
    return { markers: { include: { resource: { select: { id: true, kind: true, name: true, summary: true, bindings: { where: { chronicleId, status: 'attached' }, select: { visibility: true } } } }, location: { select: { id: true, name: true, category: true } } } }, areas: { orderBy: { createdAt: 'asc' } } }
  }

  @Get()
  async list(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID')
    const { db, narrator } = await this.access(chronicleId, request)
    const rows = await db.chronicleMap.findMany({ where: { chronicleId, ...(narrator ? {} : { status: 'ACTIVE' }) }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: this.includes(chronicleId) })
    const images = await db.chronicleAssetImage.findMany({ where: { assetType: 'MAP', entityId: { in: rows.map((row: any) => row.id) } }, select: { entityId: true } })
    const imageIds = new Set(images.map((image: any) => String(image.entityId)))
    return { chronicleId, canManage: narrator, maps: rows.map((row: any) => this.presentMap({ ...row, hasImage: imageIds.has(String(row.id)) }, chronicleId, narrator)) }
  }

  @Post()
  async create(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Body() body: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID')
    const { db, userId, narrator } = await this.access(chronicleId, request)
    if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_MAP_NARRATOR_ONLY' })
    if (!record(body)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_REQUEST' })
    const name = text(body.name, 'name', 160, true) as string
    const parentMapId = body.parentMapId === null || body.parentMapId === undefined || body.parentMapId === '' ? null : id(body.parentMapId)
    const linkedLocationId = body.linkedLocationId ? id(body.linkedLocationId) : null
    const linkedResourceId = body.linkedResourceId ? id(body.linkedResourceId) : null
    await this.assertParent(db, chronicleId, parentMapId)
    if (linkedLocationId && !await db.chronicleLocation.findFirst({ where: { id: linkedLocationId, chronicleId }, select: { id: true } })) throw new BadRequestException({ code: 'CHRONICLE_MAP_LOCATION_NOT_AVAILABLE' })
    await this.assertResource(db, chronicleId, userId, linkedResourceId)
    const created = await db.chronicleMap.create({ data: { chronicleId, parentMapId, linkedLocationId, linkedResourceId, name, description: text(body.description, 'description', 2000), sortOrder: typeof body.sortOrder === 'number' && Number.isInteger(body.sortOrder) ? body.sortOrder : 0 }, include: this.includes(chronicleId) })
    return this.presentMap({ ...created, hasImage: false }, chronicleId, narrator)
  }

  @Patch(':mapId')
  async update(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown, @Body() body: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId)
    const { db, userId, narrator } = await this.access(chronicleId, request)
    if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_MAP_NARRATOR_ONLY' })
    await this.mapOrThrow(db, chronicleId, mapId, true)
    if (!record(body)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_REQUEST' })
    const data: RecordValue = {}
    if (body.name !== undefined) data.name = text(body.name, 'name', 160, true)
    if (body.description !== undefined) data.description = text(body.description, 'description', 2000)
    if (body.parentMapId !== undefined) { const parentMapId = body.parentMapId === null || body.parentMapId === '' ? null : id(body.parentMapId); await this.assertParent(db, chronicleId, parentMapId, mapId); data.parentMapId = parentMapId }
    if (body.linkedLocationId !== undefined) { const linkedLocationId = body.linkedLocationId ? id(body.linkedLocationId) : null; if (linkedLocationId && !await db.chronicleLocation.findFirst({ where: { id: linkedLocationId, chronicleId }, select: { id: true } })) throw new BadRequestException({ code: 'CHRONICLE_MAP_LOCATION_NOT_AVAILABLE' }); data.linkedLocationId = linkedLocationId }
    if (body.linkedResourceId !== undefined) { const linkedResourceId = body.linkedResourceId ? id(body.linkedResourceId) : null; await this.assertResource(db, chronicleId, userId, linkedResourceId); data.linkedResourceId = linkedResourceId }
    if (body.sortOrder !== undefined) { if (typeof body.sortOrder !== 'number' || !Number.isInteger(body.sortOrder)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_ORDER' }); data.sortOrder = body.sortOrder }
    const row = await db.chronicleMap.update({ where: { id: mapId }, data, include: this.includes(chronicleId) })
    const image = await db.chronicleAssetImage.findUnique({ where: { assetType_entityId: { assetType: 'MAP', entityId: mapId } }, select: { entityId: true } })
    return this.presentMap({ ...row, hasImage: Boolean(image) }, chronicleId, narrator)
  }

  @Delete(':mapId')
  async deleteMap(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId)
    const { db, narrator } = await this.access(chronicleId, request)
    if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_MAP_NARRATOR_ONLY' })
    await this.mapOrThrow(db, chronicleId, mapId, true)
    const child = await db.chronicleMap.findFirst({ where: { chronicleId, parentMapId: mapId }, select: { id: true } })
    if (child) throw new BadRequestException({ code: 'CHRONICLE_MAP_HAS_CHILDREN', message: 'No se puede eliminar un mapa que contiene submapas.' })
    await db.$transaction(async (transaction: any) => {
      await transaction.chronicleAssetImage.deleteMany({ where: { assetType: 'MAP', entityId: mapId } })
      await transaction.chronicleMap.delete({ where: { id: mapId } })
    })
    return { deleted: true }
  }

  @Post(':mapId/archive')
  async archive(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId)
    const { db, narrator } = await this.access(chronicleId, request)
    if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_MAP_NARRATOR_ONLY' })
    await this.mapOrThrow(db, chronicleId, mapId, true)
    await db.chronicleMap.update({ where: { id: mapId }, data: { status: 'ARCHIVED' } })
    return { archived: true }
  }

  @Post(':mapId/markers')
  async createMarker(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown, @Body() body: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId)
    const { db, userId, narrator } = await this.access(chronicleId, request)
    if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_MAP_NARRATOR_ONLY' })
    await this.mapOrThrow(db, chronicleId, mapId)
    if (!record(body)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_MARKER' })
    const resourceId = body.resourceId ? id(body.resourceId) : null, locationId = body.locationId ? id(body.locationId) : null
    if (!resourceId && !locationId && !text(body.label, 'label', 160)) throw new BadRequestException({ code: 'CHRONICLE_MAP_MARKER_TARGET_REQUIRED' })
    await this.assertResource(db, chronicleId, userId, resourceId)
    if (locationId && !await db.chronicleLocation.findFirst({ where: { id: locationId, chronicleId }, select: { id: true } })) throw new BadRequestException({ code: 'CHRONICLE_MAP_LOCATION_NOT_AVAILABLE' })
    const marker = await db.chronicleMapMarker.create({ data: { mapId, resourceId, locationId, kind: markerKind(body.kind), label: text(body.label, 'label', 160), x: coordinate(body.x, 'x'), y: coordinate(body.y, 'y'), size: markerSize(body.size), visibility: body.visibility === 'narrator_only' ? 'narrator_only' : 'chronicle_participants' } })
    return marker
  }

  @Patch(':mapId/markers/:markerId')
  async updateMarker(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown, @Param('markerId') rawMarkerId: unknown, @Body() body: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId), markerId = id(rawMarkerId)
    const { db, userId, narrator } = await this.access(chronicleId, request)
    if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_MAP_NARRATOR_ONLY' })
    await this.mapOrThrow(db, chronicleId, mapId)
    if (!record(body)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_MARKER' })
    const data: RecordValue = {}
    if (body.x !== undefined) data.x = coordinate(body.x, 'x')
    if (body.y !== undefined) data.y = coordinate(body.y, 'y')
    if (body.kind !== undefined) data.kind = markerKind(body.kind)
    if (body.size !== undefined) data.size = markerSize(body.size)
    if (body.label !== undefined) data.label = text(body.label, 'label', 160)
    if (body.resourceId !== undefined) { const resourceId = body.resourceId ? id(body.resourceId) : null; await this.assertResource(db, chronicleId, userId, resourceId); data.resourceId = resourceId }
    if (body.locationId !== undefined) { const locationId = body.locationId ? id(body.locationId) : null; if (locationId && !await db.chronicleLocation.findFirst({ where: { id: locationId, chronicleId }, select: { id: true } })) throw new BadRequestException({ code: 'CHRONICLE_MAP_LOCATION_NOT_AVAILABLE' }); data.locationId = locationId }
    if (body.visibility !== undefined) data.visibility = body.visibility === 'narrator_only' ? 'narrator_only' : 'chronicle_participants'
    const result = await db.chronicleMapMarker.updateMany({ where: { id: markerId, mapId }, data })
    if (!result.count) throw new NotFoundException({ code: 'CHRONICLE_MAP_MARKER_NOT_FOUND' })
    return db.chronicleMapMarker.findUniqueOrThrow({ where: { id: markerId } })
  }

  @Delete(':mapId/markers/:markerId')
  async deleteMarker(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown, @Param('markerId') rawMarkerId: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId), markerId = id(rawMarkerId)
    const { db, narrator } = await this.access(chronicleId, request)
    if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_MAP_NARRATOR_ONLY' })
    await this.mapOrThrow(db, chronicleId, mapId)
    const result = await db.chronicleMapMarker.deleteMany({ where: { id: markerId, mapId } })
    if (!result.count) throw new NotFoundException({ code: 'CHRONICLE_MAP_MARKER_NOT_FOUND' })
    return { deleted: true }
  }

  @Post(':mapId/areas')
  async createArea(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown, @Body() body: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId)
    const { db, narrator } = await this.access(chronicleId, request)
    if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_MAP_NARRATOR_ONLY' })
    await this.mapOrThrow(db, chronicleId, mapId)
    if (!record(body)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_AREA' })
    return db.chronicleMapArea.create({ data: { mapId, name: text(body.name, 'name', 160, true) as string, geometry: geometry(body.geometry), color: areaColor(body.color, '#bd3e57'), fillColor: areaColor(body.fillColor, '#bd3e57'), labelColor: areaColor(body.labelColor, '#fff3ed'), labelSize: areaLabelSize(body.labelSize), labelVertical: areaLabelVertical(body.labelVertical), labelHorizontal: areaLabelHorizontal(body.labelHorizontal), visibility: body.visibility === 'narrator_only' ? 'narrator_only' : 'chronicle_participants' } })
  }

  @Patch(':mapId/areas/:areaId')
  async updateArea(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown, @Param('areaId') rawAreaId: unknown, @Body() body: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId), areaId = id(rawAreaId)
    const { db, narrator } = await this.access(chronicleId, request)
    if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_MAP_NARRATOR_ONLY' })
    await this.mapOrThrow(db, chronicleId, mapId)
    if (!record(body)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_AREA' })
    const data: RecordValue = {}
    if (body.name !== undefined) data.name = text(body.name, 'name', 160, true)
    if (body.geometry !== undefined) data.geometry = geometry(body.geometry)
    if (body.color !== undefined) data.color = areaColor(body.color, '#bd3e57')
    if (body.fillColor !== undefined) data.fillColor = areaColor(body.fillColor, '#bd3e57')
    if (body.labelColor !== undefined) data.labelColor = areaColor(body.labelColor, '#fff3ed')
    if (body.labelSize !== undefined) data.labelSize = areaLabelSize(body.labelSize)
    if (body.labelVertical !== undefined) data.labelVertical = areaLabelVertical(body.labelVertical)
    if (body.labelHorizontal !== undefined) data.labelHorizontal = areaLabelHorizontal(body.labelHorizontal)
    if (body.visibility !== undefined) data.visibility = body.visibility === 'narrator_only' ? 'narrator_only' : 'chronicle_participants'
    const result = await db.chronicleMapArea.updateMany({ where: { id: areaId, mapId }, data })
    if (!result.count) throw new NotFoundException({ code: 'CHRONICLE_MAP_AREA_NOT_FOUND' })
    return db.chronicleMapArea.findUniqueOrThrow({ where: { id: areaId } })
  }

  @Delete(':mapId/areas/:areaId')
  async deleteArea(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown, @Param('areaId') rawAreaId: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId), areaId = id(rawAreaId)
    const { db, narrator } = await this.access(chronicleId, request)
    if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_MAP_NARRATOR_ONLY' })
    await this.mapOrThrow(db, chronicleId, mapId)
    const result = await db.chronicleMapArea.deleteMany({ where: { id: areaId, mapId } })
    if (!result.count) throw new NotFoundException({ code: 'CHRONICLE_MAP_AREA_NOT_FOUND' })
    return { deleted: true }
  }

  @Post(':mapId/requests')
  async requestMarker(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown, @Body() body: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId)
    const { db, userId } = await this.access(chronicleId, request)
    await this.mapOrThrow(db, chronicleId, mapId)
    if (!record(body)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_REQUEST' })
    const resourceId = body.resourceId ? id(body.resourceId) : null
    if (resourceId && !await db.libraryResource.findFirst({ where: { id: resourceId, status: 'active', bindings: { some: { chronicleId, status: 'attached', visibility: 'chronicle_participants' } } }, select: { id: true } })) throw new BadRequestException({ code: 'CHRONICLE_MAP_RESOURCE_NOT_AVAILABLE' })
    const requestRow = await db.chronicleMapRequest.create({ data: { mapId, requesterId: userId, resourceId, title: text(body.title, 'title', 160, true) as string, description: text(body.description, 'description', 2000), kind: markerKind(body.kind), x: coordinate(body.x, 'x'), y: coordinate(body.y, 'y') } })
    return { id: requestRow.id, mapId, title: requestRow.title, status: 'pending', createdAt: requestRow.createdAt.toISOString() }
  }

  @Get(':mapId/requests')
  async listRequests(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId)
    const { db, narrator, userId } = await this.access(chronicleId, request)
    await this.mapOrThrow(db, chronicleId, mapId, narrator)
    const rows = await db.chronicleMapRequest.findMany({ where: { mapId, ...(narrator ? {} : { requesterId: userId }) }, orderBy: { createdAt: 'desc' }, include: { requester: { select: { displayName: true, username: true } }, resource: { select: { id: true, name: true, kind: true } } } })
    if (!narrator) return { items: rows.map((row: any) => ({ id: row.id, mapId, title: row.title, description: row.description, kind: row.kind, x: row.x, y: row.y, status: String(row.status).toLowerCase(), reviewNote: row.reviewNote, createdAt: row.createdAt.toISOString() })) }
    return { items: rows.map((row: any) => ({ id: row.id, mapId, title: row.title, description: row.description, kind: row.kind, x: row.x, y: row.y, status: String(row.status).toLowerCase(), reviewNote: row.reviewNote, requester: row.requester, resource: row.resource, createdAt: row.createdAt.toISOString() })) }
  }

  @Patch(':mapId/requests/:requestId')
  async reviewRequest(@Req() request: RequestWithUser, @Param('chronicleId') rawChronicleId: unknown, @Param('mapId') rawMapId: unknown, @Param('requestId') rawRequestId: unknown, @Body() body: unknown) {
    const chronicleId = id(rawChronicleId, 'INVALID_CHRONICLE_ID'), mapId = id(rawMapId), requestId = id(rawRequestId)
    const { db, narrator } = await this.access(chronicleId, request)
    if (!narrator) throw new ForbiddenException({ code: 'CHRONICLE_MAP_NARRATOR_ONLY' })
    await this.mapOrThrow(db, chronicleId, mapId, true)
    if (!record(body)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_MAP_REQUEST' })
    const status = requestStatus(body.status), reviewNote = text(body.reviewNote, 'reviewNote', 2000)
    const row = await db.chronicleMapRequest.findFirst({ where: { id: requestId, mapId }, select: { id: true, status: true, resourceId: true, title: true, kind: true, x: true, y: true } })
    if (!row) throw new NotFoundException({ code: 'CHRONICLE_MAP_REQUEST_NOT_FOUND' })
    const result = await db.$transaction(async (transaction: any) => {
      const updated = await transaction.chronicleMapRequest.update({ where: { id: requestId }, data: { status, reviewNote } })
      if (status === 'APPROVED' && row.status !== 'APPROVED') await transaction.chronicleMapMarker.create({ data: { mapId, resourceId: row.resourceId, kind: row.kind, label: row.title, x: row.x, y: row.y, size: 'large', visibility: 'chronicle_participants' } })
      return updated
    })
    return { id: result.id, status: String(result.status).toLowerCase(), reviewNote: result.reviewNote }
  }
}
