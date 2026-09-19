import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, MessageEvent, Param, Patch, Req, Sse, UnauthorizedException } from '@nestjs/common'
import { DatabaseService } from '../../database/database.service'
import { Observable } from 'rxjs'
import { publishChronicleSpaceBoard, subscribeChronicleSpaceBoard } from './chronicle-space-board.events'

type RequestWithUser = { user?: { id?: unknown } }
type Position = { readonly x: number; readonly y: number }
// CHRONICLE_SPACE_BOARD_CONNECTION_TYPES_V1
type ConnectionType = 'VISUAL' | 'KNOWN' | 'SUSPICION'
type Connection = { readonly id: string; readonly fromId: string; readonly toId: string; readonly label: string; readonly type: ConnectionType }

function actor(request: RequestWithUser): string {
  if (typeof request.user?.id !== 'string' || request.user.id.length === 0) throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
  return request.user.id
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function number(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) throw new BadRequestException({ code: 'INVALID_CHRONICLE_SPACE_BOARD', message: field + ' no es válido' })
  return Math.round(value * 100) / 100
}

function expectedRevision(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 1000000) throw new BadRequestException({ code: 'INVALID_CHRONICLE_SPACE_BOARD_REVISION' })
  return value
}

function positions(value: unknown): Record<string, Position> {
  if (value === undefined || value === null) return {}
  if (!record(value) || Object.keys(value).length > 200) throw new BadRequestException({ code: 'INVALID_CHRONICLE_SPACE_BOARD' })
  const result: Record<string, Position> = {}
  for (const [key, raw] of Object.entries(value)) {
    if (!/^[a-zA-Z0-9:_-]{1,180}$/.test(key) || !record(raw)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_SPACE_BOARD' })
    result[key] = { x: number(raw.x, 'positions.' + key + '.x'), y: number(raw.y, 'positions.' + key + '.y') }
  }
  return result
}

function connectionType(value: unknown): ConnectionType {
  if (value === undefined || value === null) return 'VISUAL'
  if (value !== 'VISUAL' && value !== 'KNOWN' && value !== 'SUSPICION') throw new BadRequestException({ code: 'INVALID_CHRONICLE_SPACE_BOARD_CONNECTION_TYPE' })
  return value
}

function connections(value: unknown): Connection[] {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value) || value.length > 200) throw new BadRequestException({ code: 'INVALID_CHRONICLE_SPACE_BOARD' })
  const result: Connection[] = []
  for (const raw of value) {
    if (!record(raw) || typeof raw.id !== 'string' || typeof raw.fromId !== 'string' || typeof raw.toId !== 'string' || typeof raw.label !== 'string' || (raw.type !== undefined && raw.type !== 'VISUAL' && raw.type !== 'KNOWN' && raw.type !== 'SUSPICION') || raw.id.length > 180 || raw.fromId.length > 180 || raw.toId.length > 180 || raw.fromId === raw.toId || raw.label.length > 160) throw new BadRequestException({ code: 'INVALID_CHRONICLE_SPACE_BOARD' })
    result.push({ id: raw.id, fromId: raw.fromId, toId: raw.toId, label: raw.label.trim(), type: connectionType(raw.type) })
  }
  return result
}

function sameBoardState(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

@Controller('chronicles/:chronicleId/space-board')
export class ChronicleSpaceBoardController {
  constructor(private readonly database: DatabaseService) {}

  private async access(chronicleId: string, userId: string) {
    const db = this.database as any
    const chronicle = await db.chronicle.findUnique({ where: { id: chronicleId }, select: { id: true, narratorId: true, participants: { where: { userId, status: 'ACTIVE' }, select: { userId: true } } } })
    if (!chronicle) throw new ForbiddenException({ code: 'CHRONICLE_NOT_FOUND' })
    if (chronicle.narratorId !== userId && chronicle.participants.length === 0) throw new ForbiddenException({ code: 'CHRONICLE_SPACE_BOARD_PERMISSION_DENIED' })
    return db
  }

  private present(row: any, chronicleId: string) {
    const state = record(row?.state) ? row.state : {}
    return { chronicleId, positions: positions(state.positions), connections: connections(state.connections), revision: Number(row?.revision ?? 0), updatedAt: row?.updatedAt ?? null }
  }

  private conflict(chronicleId: string, row: any): never {
    throw new ConflictException({ code: 'CHRONICLE_SPACE_BOARD_CONFLICT', message: 'La pizarra cambió en otro usuario. Recarga para continuar.', current: this.present(row, chronicleId) })
  }

  @Get()
  async get(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string) {
    const db = await this.access(chronicleId, actor(request))
    const row = await db.chronicleSpaceBoard.findUnique({ where: { chronicleId } })
    return this.present(row, chronicleId)
  }

  @Sse('events')
  async events(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string): Promise<Observable<MessageEvent>> {
    const db = await this.access(chronicleId, actor(request))
    const current = await db.chronicleSpaceBoard.findUnique({ where: { chronicleId } })
    return new Observable<MessageEvent>((subscriber) => {
      subscriber.next({ data: this.present(current, chronicleId) })
      return subscribeChronicleSpaceBoard(chronicleId, (snapshot) => subscriber.next({ data: snapshot as object }))
    })
  }

  @Patch()
  async replace(@Req() request: RequestWithUser, @Param('chronicleId') chronicleId: string, @Body() body: unknown) {
    const db = await this.access(chronicleId, actor(request))
    if (!record(body)) throw new BadRequestException({ code: 'INVALID_CHRONICLE_SPACE_BOARD' })
    const expected = expectedRevision(body.revision)
    const next = { positions: positions(body.positions), connections: connections(body.connections) }
    const existing = await db.chronicleSpaceBoard.findUnique({ where: { chronicleId } })

    if (!existing) {
      if (expected !== 0) this.conflict(chronicleId, null)
      try {
        const created = await db.chronicleSpaceBoard.create({ data: { chronicleId, state: next, revision: 1 } })
        const snapshot = this.present(created, chronicleId)
        publishChronicleSpaceBoard(chronicleId, snapshot)
        return snapshot
      } catch (error: any) {
        if (error?.code === 'P2002') {
          const current = await db.chronicleSpaceBoard.findUnique({ where: { chronicleId } })
          this.conflict(chronicleId, current)
        }
        throw error
      }
    }

    if (existing.revision !== expected) this.conflict(chronicleId, existing)
    const existingState = record(existing.state) ? { positions: positions(existing.state.positions), connections: connections(existing.state.connections) } : { positions: {}, connections: [] }
    if (sameBoardState(existingState, next)) return this.present(existing, chronicleId)
    const changed = await db.chronicleSpaceBoard.updateMany({ where: { chronicleId, revision: expected }, data: { state: next, revision: { increment: 1 } } })
    if (changed.count !== 1) {
      const current = await db.chronicleSpaceBoard.findUnique({ where: { chronicleId } })
      this.conflict(chronicleId, current)
    }
    const saved = await db.chronicleSpaceBoard.findUnique({ where: { chronicleId } })
    const snapshot = this.present(saved, chronicleId)
    publishChronicleSpaceBoard(chronicleId, snapshot)
    return snapshot
  }
}
