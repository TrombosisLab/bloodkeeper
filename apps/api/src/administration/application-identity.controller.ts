import { BadRequestException, ConflictException, Controller, Delete, ForbiddenException, Get, Headers, Header, NotFoundException, Param, PayloadTooLargeException, Put, Req, StreamableFile, UnauthorizedException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { DatabaseService } from '../database/database.service'
import { generateApplicationIcons, MAX_ICON_BYTES } from './application-identity.images'
import { writeAdministrationAuditEvent } from './audit-log'

type Request = AsyncIterable<Buffer> & { user?: { id?: unknown; roles?: unknown }; headers: Record<string, string | undefined> }
export function identityAdministrator(request: Pick<Request, 'user'>): string {
  if (typeof request.user?.id !== 'string') throw new UnauthorizedException()
  if (!Array.isArray(request.user.roles) || !request.user.roles.includes('admin')) throw new ForbiddenException()
  return request.user.id
}
function version(value: unknown): string {
  if (value === 'default' || (typeof value === 'string' && /^[0-9a-f-]{36}$/.test(value))) return value
  throw new BadRequestException({ code: 'APPLICATION_ICON_REVISION_REQUIRED' })
}
async function readImage(request: Request): Promise<Buffer> {
  // Raw binary body: JSON parsers must never consume this upload.
  if (request.headers['content-type']?.split(';')[0] !== 'application/octet-stream') throw new BadRequestException({ code: 'APPLICATION_ICON_BINARY_REQUIRED' })
  const chunks: Buffer[] = []
  let length = 0
  for await (const chunk of request) {
    length += chunk.length
    if (length > MAX_ICON_BYTES) throw new PayloadTooLargeException()
    chunks.push(chunk)
  }
  if (!length) throw new BadRequestException({ code: 'APPLICATION_ICON_EMPTY' })
  return Buffer.concat(chunks)
}

@Controller('application')
export class ApplicationIdentityController {
  constructor(private readonly db: DatabaseService) {}

  @Get('identity')
  @Header('Cache-Control', 'no-store')
  async identity() {
    const row = await this.db.applicationIdentity.findUnique({ where: { id: 1 }, select: { revision: true } })
    const revision = row?.revision ?? 'default'
    return { revision, custom: Boolean(row), icon: row ? `/api/application/icons/${revision}/192.png` : '/icons/bloodkeeper-192.png', appleIcon: row ? `/api/application/icons/${revision}/180.png` : '/icons/bloodkeeper-180.png' }
  }

  @Get('manifest.webmanifest')
  @Header('Cache-Control', 'no-cache')
  @Header('Content-Type', 'application/manifest+json; charset=utf-8')
  async manifest() {
    const { revision, custom } = await this.identity()
    const icon = (size: string) => custom ? `/api/application/icons/${revision}/${size}.png` : `/icons/bloodkeeper-${size}.png`
    return { id: '/', name: 'BloodKeeper', short_name: 'BloodKeeper', lang: 'es', description: 'Crónicas de Vampiro V5. Requiere conexión al servidor.',
      start_url: '/?chronicle-space=fresh&source=installed#/dashboard', scope: '/', display: 'standalone', background_color: '#100d0e', theme_color: '#171013', prefer_related_applications: false,
      icons: [{ src: icon('192'), sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: icon('512'), sizes: '512x512', type: 'image/png', purpose: 'any' }, { src: custom ? icon('maskable') : '/icons/bloodkeeper-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] }
  }

  @Get('icons/:revision/:size')
  @Header('Cache-Control', 'public, max-age=300')
  @Header('X-Content-Type-Options', 'nosniff')
  async icon(@Param('revision') revision: string, @Param('size') size: string) {
    const fields = new Map<string, 'icon180' | 'icon192' | 'icon512' | 'maskable'>([['180.png', 'icon180'], ['192.png', 'icon192'], ['512.png', 'icon512'], ['maskable.png', 'maskable']])
    const field = fields.get(size)
    if (!field || !/^[0-9a-f-]{36}$/.test(revision)) throw new NotFoundException()
    const row = await this.db.applicationIdentity.findUnique({ where: { id: 1 } })
    if (!row || row.revision !== revision) throw new NotFoundException()
    return new StreamableFile(Buffer.from(row[field]), { type: 'image/png', disposition: 'inline' })
  }

  @Put('identity/icon')
  async save(@Req() request: Request, @Headers('if-match') expected: unknown) {
    const actorId = identityAdministrator(request)
    const previous = version(expected)
    const icons = await generateApplicationIcons(await readImage(request))
    const data = { revision: randomUUID(), icon180: Uint8Array.from(icons.icon180), icon192: Uint8Array.from(icons.icon192), icon512: Uint8Array.from(icons.icon512), maskable: Uint8Array.from(icons.maskable) }
    if (previous === 'default') {
      try { await this.db.applicationIdentity.create({ data: { id: 1, ...data } }) }
      catch (error) { if ((error as { code?: string }).code === 'P2002') throw new ConflictException({ code: 'APPLICATION_ICON_CONFLICT' }); throw error }
    } else {
      const result = await this.db.applicationIdentity.updateMany({ where: { id: 1, revision: previous }, data })
      if (!result.count) throw new ConflictException({ code: 'APPLICATION_ICON_CONFLICT' })
    }
    writeAdministrationAuditEvent({ action: 'application.icon.update', actorId })
    return this.identity()
  }

  @Delete('identity/icon')
  async reset(@Req() request: Request, @Headers('if-match') expected: unknown) {
    const actorId = identityAdministrator(request)
    const previous = version(expected)
    if (previous !== 'default') {
      const result = await this.db.applicationIdentity.deleteMany({ where: { id: 1, revision: previous } })
      if (!result.count) throw new ConflictException({ code: 'APPLICATION_ICON_CONFLICT' })
    } else if ((await this.identity()).custom) throw new ConflictException({ code: 'APPLICATION_ICON_CONFLICT' })
    writeAdministrationAuditEvent({ action: 'application.icon.reset', actorId })
    return this.identity()
  }
}
