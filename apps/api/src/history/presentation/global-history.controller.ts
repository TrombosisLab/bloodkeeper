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
  Query,
  Req,
  UnauthorizedException,
  Put, Delete, StreamableFile, PayloadTooLargeException, Header,
} from '@nestjs/common'
import { referenceCatalog, validateReferences, characterWhere, resourceWhere, nativeWhere } from './history-reference-access'

import { DatabaseService } from '../../database/database.service'

type RequestWithUser = {
  readonly user?: {
    readonly id?: unknown
    readonly roles?: readonly unknown[]
  }
}

type RecordValue = Record<string, unknown>

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const categories = [
  'event',
  'era',
  'person',
  'organization',
  'place',
  'other',
] as const

const sourceKinds = [
  'canon',
  'custom',
  'alternate',
] as const

const visibilities = [
  'all_users',
  'narrators_only',
  'private',
] as const

const writableStatuses = [
  'draft',
  'published',
] as const

type HistoryCategory =
  typeof categories[number]

type HistorySourceKind =
  typeof sourceKinds[number]

type HistoryVisibility =
  typeof visibilities[number]

type WritableHistoryStatus =
  typeof writableStatuses[number]

function record(
  value: unknown,
): value is RecordValue {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
}

function authenticatedActor(
  request: RequestWithUser,
): {
  readonly userId: string
  readonly roles: readonly string[]
  readonly admin: boolean
  readonly narrator: boolean
} {
  const userId = request.user?.id

  if (
    typeof userId !== 'string' ||
    !uuidPattern.test(userId)
  ) {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }

  const roles = Array.isArray(request.user?.roles)
    ? request.user.roles
        .filter(
          (role): role is string =>
            typeof role === 'string',
        )
        .map((role) => role.toLowerCase())
    : []

  return {
    userId,
    roles,
    admin: roles.includes('admin'),
    narrator:
      roles.includes('admin') ||
      roles.includes('narrator'),
  }
}

function requiredText(
  value: unknown,
  field: string,
  maximum: number,
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value.trim().length > maximum
  ) {
    throw new BadRequestException({
      code: 'INVALID_GLOBAL_HISTORY_ENTRY',
      message: `${field} no es válido`,
    })
  }

  return value.trim()
}

function optionalText(
  value: unknown,
  field: string,
  maximum: number,
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  if (
    typeof value !== 'string' ||
    value.trim().length > maximum
  ) {
    throw new BadRequestException({
      code: 'INVALID_GLOBAL_HISTORY_ENTRY',
      message: `${field} no es válido`,
    })
  }

  return value.trim() || null
}

function optionalYear(
  value: unknown,
  field: string,
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null
  }

  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN

  if (
    !Number.isInteger(parsed) ||
    parsed < -100000 ||
    parsed > 100000
  ) {
    throw new BadRequestException({
      code: 'INVALID_GLOBAL_HISTORY_ENTRY',
      message: `${field} debe ser un año válido`,
    })
  }

  return parsed
}

function choice<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T {
  if (
    typeof value !== 'string' ||
    !allowed.includes(value as T)
  ) {
    throw new BadRequestException({
      code: 'INVALID_GLOBAL_HISTORY_ENTRY',
      message: `${field} no es válido`,
    })
  }

  return value as T
}

function tags(value: unknown): string[] {
  if (value === undefined || value === null) {
    return []
  }

  if (!Array.isArray(value) || value.length > 20) {
    throw new BadRequestException({
      code: 'INVALID_GLOBAL_HISTORY_ENTRY',
      message: 'tags no es válido',
    })
  }

  const normalized = value.map((tag) => {
    if (
      typeof tag !== 'string' ||
      tag.trim().length === 0 ||
      tag.trim().length > 40
    ) {
      throw new BadRequestException({
        code: 'INVALID_GLOBAL_HISTORY_ENTRY',
        message: 'tags no es válido',
      })
    }

    return tag.trim().toLowerCase()
  })

  return [...new Set(normalized)]
}

function ids(value: unknown): string[] {
  if (value === undefined || value === null) {
    return []
  }

  if (!Array.isArray(value) || value.length > 50) {
    throw new BadRequestException({
      code: 'INVALID_GLOBAL_HISTORY_ENTRY',
      message: 'chronicleIds no es válido',
    })
  }

  const parsed = value.map((entry) => {
    if (
      typeof entry !== 'string' ||
      !uuidPattern.test(entry)
    ) {
      throw new BadRequestException({
        code: 'INVALID_GLOBAL_HISTORY_ENTRY',
        message: 'chronicleIds no es válido',
      })
    }

    return entry
  })

  return [...new Set(parsed)]
}

function entryId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !uuidPattern.test(value)
  ) {
    throw new BadRequestException({
      code: 'INVALID_GLOBAL_HISTORY_ENTRY_ID',
    })
  }

  return value
}

function databaseVisibility(
  value: HistoryVisibility,
): 'ALL_USERS' | 'NARRATORS_ONLY' | 'PRIVATE' {
  if (value === 'narrators_only') {
    return 'NARRATORS_ONLY'
  }

  if (value === 'private') {
    return 'PRIVATE'
  }

  return 'ALL_USERS'
}

function databaseStatus(
  value: WritableHistoryStatus,
): 'DRAFT' | 'PUBLISHED' {
  return value === 'published'
    ? 'PUBLISHED'
    : 'DRAFT'
}

@Controller('history')
export class GlobalHistoryController {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  private managerWhere(
    userId: string,
    admin: boolean,
  ): RecordValue {
    return admin
      ? {}
      : {
          OR: [
            { narratorId: userId },
            {
              participants: {
                some: {
                  userId,
                  role: 'NARRATOR',
                  status: 'ACTIVE',
                },
              },
            },
          ],
        }
  }

  private readableWhere(
    userId: string,
    admin: boolean,
  ): RecordValue {
    return admin
      ? {}
      : {
          OR: [
            { narratorId: userId },
            {
              participants: {
                some: {
                  userId,
                  status: 'ACTIVE',
                },
              },
            },
          ],
        }
  }

  private async chronicleCatalog(
    userId: string,
    admin: boolean,
    manageOnly: boolean,
  ): Promise<readonly { id: string; name: string }[]> {
    const database = this.database as any

    return database.chronicle.findMany({
      where: manageOnly
        ? this.managerWhere(userId, admin)
        : this.readableWhere(userId, admin),
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    })
  }

  private async assertChroniclesManageable(
    chronicleIds: readonly string[],
    userId: string,
    admin: boolean,
  ): Promise<void> {
    if (chronicleIds.length === 0) return

    const database = this.database as any
    const count =
      await database.chronicle.count({
        where: {
          id: { in: chronicleIds },
          ...this.managerWhere(userId, admin),
        },
      })

    if (count !== chronicleIds.length) {
      throw new ForbiddenException({
        code: 'GLOBAL_HISTORY_CHRONICLE_PERMISSION_DENIED',
      })
    }
  }

  private canEdit(
    row: { authorId: string; visibility: string },
    actor: ReturnType<typeof authenticatedActor>,
  ): boolean {
    return actor.admin ||
      (
        actor.narrator &&
        (
          row.visibility !== 'PRIVATE' ||
          row.authorId === actor.userId
        )
      )
  }

  private present(
    row: any,
    readableChronicleIds: ReadonlySet<string>,
    actor: ReturnType<typeof authenticatedActor>,
  ) {
    return {
      id: row.id,
      title: row.title,
      periodLabel: row.periodLabel,
      startYear: row.startYear,
      endYear: row.endYear,
      category: row.category,
      summary: row.summary,
      content: row.content,
      references: row.references ?? [],
      imageCaption: row.imageCaption,
      imageCredit: row.imageCredit,
      imageUpdatedAt: row.image?.updatedAt ?? null,
      sourceKind: row.sourceKind,
      visibility: String(row.visibility).toLowerCase(),
      status: String(row.status).toLowerCase(),
      tags: row.tags,
      author: row.author,
      chronicles: (row.chronicles ?? [])
        .filter(
          (link: any) =>
            readableChronicleIds.has(
              String(link.chronicleId),
            ),
        )
        .map((link: any) => link.chronicle),
      canEdit: this.canEdit(row, actor),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  }

  private include() {
    return {
      image: { select: { updatedAt: true } },
      author: {
        select: {
          id: true,
          displayName: true,
        },
      },
      chronicles: {
        include: {
          chronicle: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    }
  }

  private async editableEntry(
    id: string,
    actor: ReturnType<typeof authenticatedActor>,
  ) {
    const database = this.database as any
    const row =
      await database.globalHistoryEntry.findUnique({
        where: { id },
        select: {
          id: true,
          authorId: true,
          visibility: true,
        },
      })

    if (!row) {
      throw new NotFoundException({
        code: 'GLOBAL_HISTORY_ENTRY_NOT_FOUND',
      })
    }

    if (!this.canEdit(row, actor)) {
      throw new ForbiddenException({
        code: 'GLOBAL_HISTORY_PERMISSION_DENIED',
      })
    }

    return row
  }

  @Get()
  async list(
    @Req() request: RequestWithUser,
    @Query('includeArchived')
      includeArchived: unknown,
  ) {
    const actor = authenticatedActor(request)
    const database = this.database as any

    const where = actor.admin
      ? includeArchived === 'true'
        ? {}
        : { status: { not: 'ARCHIVED' } }
      : actor.narrator
        ? {
            status:
              includeArchived === 'true'
                ? undefined
                : { not: 'ARCHIVED' },
            OR: [
              { visibility: { not: 'PRIVATE' } },
              { authorId: actor.userId },
            ],
          }
        : {
            status: 'PUBLISHED',
            visibility: 'ALL_USERS',
          }

    const [rows, readableChronicles, manageableChronicles] =
      await Promise.all([
        database.globalHistoryEntry.findMany({
          where,
          orderBy: [
            { startYear: 'desc' },
            { updatedAt: 'desc' },
          ],
          include: this.include(),
        }),
        this.chronicleCatalog(
          actor.userId,
          actor.admin,
          false,
        ),
        actor.narrator
          ? this.chronicleCatalog(
              actor.userId,
              actor.admin,
              true,
            )
          : Promise.resolve([]),
      ])

    const readableIds = new Set<string>(
      readableChronicles.map(
        (chronicle) => chronicle.id,
      ),
    )

    return {
      canManage: actor.narrator,
      availableChronicles:
        manageableChronicles,
      items: rows.map((row: any) =>
        this.present(
          row,
          readableIds,
          actor,
        ),
      ),
    }
  }

  @Post()
  async create(
    @Req() request: RequestWithUser,
    @Body() body: unknown,
  ) {
    const actor = authenticatedActor(request)

    if (!actor.narrator) {
      throw new ForbiddenException({
        code: 'GLOBAL_HISTORY_PERMISSION_DENIED',
      })
    }

    if (!record(body)) {
      throw new BadRequestException({
        code: 'INVALID_GLOBAL_HISTORY_ENTRY',
      })
    }

    const startYear =
      optionalYear(body.startYear, 'startYear')
    const endYear =
      optionalYear(body.endYear, 'endYear')

    if (
      startYear !== null &&
      endYear !== null &&
      endYear < startYear
    ) {
      throw new BadRequestException({
        code: 'INVALID_GLOBAL_HISTORY_ENTRY',
        message: 'endYear no puede ser anterior a startYear',
      })
    }

    const chronicleIds = ids(body.chronicleIds)
    await this.assertChroniclesManageable(
      chronicleIds,
      actor.userId,
      actor.admin,
    )

    const database = this.database as any
    const created =
      await database.globalHistoryEntry.create({
        data: {
          authorId: actor.userId,
          references: await validateReferences(database, actor, body.references ?? []),
          imageCaption: optionalText(body.imageCaption, 'imageCaption', 300),
          imageCredit: optionalText(body.imageCredit, 'imageCredit', 300),
          title: requiredText(
            body.title,
            'title',
            160,
          ),
          periodLabel: optionalText(
            body.periodLabel,
            'periodLabel',
            120,
          ),
          startYear,
          endYear,
          category: choice(
            body.category ?? 'event',
            categories,
            'category',
          ) satisfies HistoryCategory,
          summary: optionalText(
            body.summary,
            'summary',
            1000,
          ),
          content:
            optionalText(
              body.content,
              'content',
              20000,
            ) ?? '',
          sourceKind: choice(
            body.sourceKind ?? 'custom',
            sourceKinds,
            'sourceKind',
          ) satisfies HistorySourceKind,
          visibility: databaseVisibility(
            choice(
              body.visibility ?? 'all_users',
              visibilities,
              'visibility',
            ),
          ),
          status: databaseStatus(
            choice(
              body.status ?? 'draft',
              writableStatuses,
              'status',
            ),
          ),
          tags: tags(body.tags),
          chronicles: {
            create: chronicleIds.map(
              (chronicleId) => ({
                chronicleId,
              }),
            ),
          },
        },
        include: this.include(),
      })

    const readable = new Set<string>(
      (
        await this.chronicleCatalog(
          actor.userId,
          actor.admin,
          false,
        )
      ).map((chronicle) => chronicle.id),
    )

    return this.present(
      created,
      readable,
      actor,
    )
  }

  @Patch(':entryId')
  async update(
    @Req() request: RequestWithUser,
    @Param('entryId') rawEntryId: unknown,
    @Body() body: unknown,
  ) {
    const actor = authenticatedActor(request)
    const id = entryId(rawEntryId)
    await this.editableEntry(id, actor)

    if (!record(body)) {
      throw new BadRequestException({
        code: 'INVALID_GLOBAL_HISTORY_ENTRY',
      })
    }

    const data: RecordValue = {}
    if (body.references !== undefined) {
      const existing = await (this.database as any).globalHistoryEntry.findUnique({ where: { id }, select: { references: true } })
      data.references = await validateReferences(this.database, actor, body.references, existing?.references)
    }
    for (const field of ['imageCaption', 'imageCredit']) {
      if (body[field] !== undefined) data[field] = optionalText(body[field], field, 300)
    }

    if (body.title !== undefined) {
      data.title = requiredText(
        body.title,
        'title',
        160,
      )
    }

    if (body.periodLabel !== undefined) {
      data.periodLabel = optionalText(
        body.periodLabel,
        'periodLabel',
        120,
      )
    }

    if (body.startYear !== undefined) {
      data.startYear = optionalYear(
        body.startYear,
        'startYear',
      )
    }

    if (body.endYear !== undefined) {
      data.endYear = optionalYear(
        body.endYear,
        'endYear',
      )
    }

    if (body.category !== undefined) {
      data.category = choice(
        body.category,
        categories,
        'category',
      )
    }

    if (body.summary !== undefined) {
      data.summary = optionalText(
        body.summary,
        'summary',
        1000,
      )
    }

    if (body.content !== undefined) {
      data.content =
        optionalText(
          body.content,
          'content',
          20000,
        ) ?? ''
    }

    if (body.sourceKind !== undefined) {
      data.sourceKind = choice(
        body.sourceKind,
        sourceKinds,
        'sourceKind',
      )
    }

    if (body.visibility !== undefined) {
      data.visibility = databaseVisibility(
        choice(
          body.visibility,
          visibilities,
          'visibility',
        ),
      )
    }

    if (body.status !== undefined) {
      data.status = databaseStatus(
        choice(
          body.status,
          writableStatuses,
          'status',
        ),
      )
    }

    if (body.tags !== undefined) {
      data.tags = tags(body.tags)
    }

    if (body.chronicleIds !== undefined) {
      const chronicleIds = ids(body.chronicleIds)
      await this.assertChroniclesManageable(
        chronicleIds,
        actor.userId,
        actor.admin,
      )
      data.chronicles = {
        deleteMany: {},
        create: chronicleIds.map(
          (chronicleId) => ({ chronicleId }),
        ),
      }
    }

    const database = this.database as any
    const current =
      await database.globalHistoryEntry.findUnique({
        where: { id },
        select: {
          startYear: true,
          endYear: true,
        },
      })
    const nextStart =
      data.startYear === undefined
        ? current?.startYear ?? null
        : data.startYear
    const nextEnd =
      data.endYear === undefined
        ? current?.endYear ?? null
        : data.endYear

    if (
      typeof nextStart === 'number' &&
      typeof nextEnd === 'number' &&
      nextEnd < nextStart
    ) {
      throw new BadRequestException({
        code: 'INVALID_GLOBAL_HISTORY_ENTRY',
        message: 'endYear no puede ser anterior a startYear',
      })
    }

    const updated =
      await database.globalHistoryEntry.update({
        where: { id },
        data,
        include: this.include(),
      })
    const readable = new Set<string>(
      (
        await this.chronicleCatalog(
          actor.userId,
          actor.admin,
          false,
        )
      ).map((chronicle) => chronicle.id),
    )

    return this.present(
      updated,
      readable,
      actor,
    )
  }

  @Get('reference-catalog')
  async catalog(@Req() request: RequestWithUser) {
    const actor = authenticatedActor(request)
    if (!actor.narrator) throw new ForbiddenException()
    return { items: await referenceCatalog(this.database, actor) }
  }

  private async readableEntry(request: RequestWithUser, raw: unknown) {
    const id = entryId(raw)
    const actor = authenticatedActor(request)
    const db = this.database as any
    const row = await db.globalHistoryEntry.findFirst({ where: { id, ...(actor.admin ? {} : actor.narrator ? { OR: [{ visibility: { not: 'PRIVATE' } }, { authorId: actor.userId }] } : { status: 'PUBLISHED', visibility: 'ALL_USERS' }) } })
    if (!row) throw new NotFoundException({ code: 'GLOBAL_HISTORY_ENTRY_NOT_FOUND' })
    return { row, actor }
  }

  @Get(':entryId/reference')
  async reference(@Req() request: RequestWithUser, @Param('entryId') raw: unknown, @Query('key') key: unknown) {
    const { row, actor } = await this.readableEntry(request, raw)
    const ref = Array.isArray(row.references) ? row.references.find((r: any) => r.key === key) : null
    if (!ref) throw new NotFoundException()
    const db = this.database as any
    if (ref.type === 'npc' || ref.type === 'location') {
      const delegate = ref.type === 'npc' ? db.chronicleNpc : db.chronicleLocation
      const target = await delegate.findFirst({ where: { id: ref.id, ...nativeWhere(actor) }, select: { name: true, category: true, description: true } })
      if (!target) throw new ForbiddenException({ code: 'HISTORY_REFERENCE_UNKNOWN' })
      return { label: target.name, category: target.category, description: target.description ?? '' }
    }
    const target = ref.type === 'resource'
      ? await db.libraryResource.findFirst({ where: { id: ref.id, ...resourceWhere(actor) }, select: { name: true, summary: true, kind: true } })
      : await db.character.findFirst({ where: { id: ref.id, ...characterWhere(actor) }, select: { identity: { select: { name: true, concept: true } } } })
    if (!target) throw new ForbiddenException({ code: 'HISTORY_REFERENCE_UNKNOWN', message: 'Conoces su nombre, pero no tienes acceso a más información sobre este elemento.' })
    return ref.type === 'resource' ? { label: target.name, category: target.kind, description: target.summary ?? '' } : { label: target.identity?.name ?? ref.label, category: 'Personaje jugador', description: target.identity?.concept ?? '' }
  }

  @Get(':entryId/image')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async image(@Req() request: RequestWithUser, @Param('entryId') raw: unknown) {
    const { row } = await this.readableEntry(request, raw)
    const image = await (this.database as any).globalHistoryImage.findUnique({ where: { entryId: row.id } })
    if (!image) throw new NotFoundException()
    return new StreamableFile(Buffer.from(image.data), { type: image.mimeType, length: image.byteSize, disposition: 'inline' })
  }

  @Put(':entryId/image')
  async uploadImage(@Req() request: any, @Param('entryId') raw: unknown) {
    const actor = authenticatedActor(request), id = entryId(raw)
    await this.editableEntry(id, actor)
    const chunks: Buffer[] = []; let size = 0
    for await (const part of request) {
      const chunk = Buffer.from(part); size += chunk.length
      if (size > 5 * 1024 * 1024) throw new PayloadTooLargeException({ code: 'HISTORY_IMAGE_TOO_LARGE' })
      chunks.push(chunk)
    }
    const data = Buffer.concat(chunks)
    const mime = data.length >= 8 && data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' : data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255 ? 'image/jpeg' : data.length >= 12 && data.subarray(0,4).toString() === 'RIFF' && data.subarray(8,12).toString() === 'WEBP' ? 'image/webp' : null
    if (!mime || request.headers['content-type']?.split(';')[0] !== mime) throw new BadRequestException({ code: 'HISTORY_IMAGE_INVALID' })
    const fields = { mimeType: mime, byteSize: size, data: Uint8Array.from(data), updatedAt: new Date() }
    await (this.database as any).globalHistoryImage.upsert({ where: { entryId: id }, create: { entryId: id, ...fields }, update: fields })
    return { saved: true }
  }

  @Delete(':entryId/image')
  async removeImage(@Req() request: RequestWithUser, @Param('entryId') raw: unknown) {
    const id = entryId(raw); await this.editableEntry(id, authenticatedActor(request))
    await (this.database as any).globalHistoryImage.deleteMany({ where: { entryId: id } })
    return { removed: true }
  }

  @Post(':entryId/archive')
  async archive(
    @Req() request: RequestWithUser,
    @Param('entryId') rawEntryId: unknown,
  ) {
    const actor = authenticatedActor(request)
    const id = entryId(rawEntryId)
    await this.editableEntry(id, actor)

    const database = this.database as any
    await database.globalHistoryEntry.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })

    return { id, status: 'archived' }
  }
}
