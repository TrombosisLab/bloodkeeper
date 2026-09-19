import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, Patch, Req, UnauthorizedException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'

type RequestWithUser = { user?: { id?: unknown } }
type JsonRecord = Record<string, unknown>

function actor(request: RequestWithUser): string {
  if (typeof request.user?.id !== 'string' || request.user.id.length === 0) throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
  return request.user.id
}
function record(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
function personalState(value: unknown): JsonRecord {
  if (!record(value)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_SPACE_BOARD_PERSONAL_STATE' })
  const serialized = JSON.stringify(value) ?? ''
  if (serialized.length > 800000) throw new BadRequestException({ code: 'CHRONICLE_SPACE_BOARD_PERSONAL_STATE_TOO_LARGE' })
  return value
}

@Controller('chronicles/:chronicleId/space-board/personal')
export class ChronicleSpaceBoardPersonalController {
  constructor(private readonly database: DatabaseService) {}

  private async access(chronicleId: string, userId: string) {
    const db = this.database as any
    const chronicle = await db.chronicle.findUnique({ where: { id: chronicleId }, select: { id: true, narratorId: true, participants: { where: { userId, status: 'ACTIVE' }, select: { userId: true } } } })
    if (!chronicle) throw new ForbiddenException({ code: 'CHRONICLE_NOT_FOUND' })
    if (chronicle.narratorId !== userId && chronicle.participants.length === 0) throw new ForbiddenException({ code: 'CHRONICLE_SPACE_BOARD_PERMISSION_DENIED' })
    return db
  }

  private present(row: any, chronicleId: string, userId: string) {
    return { chronicleId, userId, state: record(row?.state) ? row.state : {}, revision: Number(row?.revision ?? 0), updatedAt: row?.updatedAt ?? null }
  }

  @Get()
  async get(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string) {
    const userId = actor(request)
    const db = await this.access(chronicleId, userId)
    const row = await db.chronicleSpaceBoardPersonalState.findUnique({ where: { chronicleId_userId: { chronicleId, userId } } })
    return this.present(row, chronicleId, userId)
  }

  @Patch()
  async replace(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string, @Body() body: unknown) {
    const userId = actor(request)
    const db = await this.access(chronicleId, userId)
    if (!record(body)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_SPACE_BOARD_PERSONAL_STATE' })
    const state = personalState(body.state)
    const row = await db.chronicleSpaceBoardPersonalState.upsert({ where: { chronicleId_userId: { chronicleId, userId } }, create: { chronicleId, userId, state }, update: { state, revision: { increment: 1 } } })
    return this.present(row, chronicleId, userId)
  }
}
