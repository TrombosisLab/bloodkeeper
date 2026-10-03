import {
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import { DatabaseService } from '../../database/database.service'

type RequestWithUser = {
  readonly user?: { readonly id?: unknown }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function actorId(request: RequestWithUser): string {
  const id = request.user?.id
  if (typeof id !== 'string' || !uuidPattern.test(id)) {
    throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
  }
  return id
}

function chronicleId(value: string): string {
  if (!uuidPattern.test(value)) {
    throw new NotFoundException({ code: 'CHRONICLE_ARCHIVE_NOT_FOUND' })
  }
  return value
}

@Controller('history/chronicles')
export class ChronicleArchiveController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async listChronicles(@Req() request: RequestWithUser) {
    const userId = actorId(request)
    const database = this.database as any
    const items = await database.chronicle.findMany({
      where: {
        participants: {
          some: { userId, status: 'ACTIVE' },
        },
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    })
    return { items }
  }

  @Get(':chronicleId')
  async archive(
    @Req() request: RequestWithUser,
    @Param('chronicleId') rawChronicleId: string,
  ) {
    const userId = actorId(request)
    const id = chronicleId(rawChronicleId)
    const database = this.database as any
    const chronicle = await database.chronicle.findFirst({
      where: {
        id,
        participants: {
          some: { userId, status: 'ACTIVE' },
        },
      },
      select: { id: true, name: true },
    })

    // Return the same response for an unknown Chronicle and a non-member.
    if (!chronicle) {
      throw new ForbiddenException({ code: 'CHRONICLE_ARCHIVE_ACCESS_DENIED' })
    }

    const [sessions, stories] = await Promise.all([
      database.chronicleSession.findMany({
        where: {
          chronicleId: id,
          status: 'COMPLETED',
          summary: { not: null },
        },
        orderBy: [{ realDate: 'asc' }, { sessionNumber: 'asc' }],
        select: {
          id: true,
          sessionNumber: true,
          title: true,
          realDate: true,
          summary: true,
          updatedAt: true,
        },
      }),
      database.chronicleStory.findMany({
        where: {
          chronicleId: id,
          status: { in: ['COMPLETED', 'ARCHIVED'] },
          completedAt: { not: null },
          visibility: 'CHRONICLE_PARTICIPANTS',
          sharedSummary: { not: null },
        },
        orderBy: [{ completedAt: 'asc' }, { sortOrder: 'asc' }],
        select: {
          id: true,
          title: true,
          type: true,
          sharedSummary: true,
          completedAt: true,
        },
      }),
    ])

    const items = [
      ...sessions
        .filter((session: any) => typeof session.summary === 'string' && session.summary.trim())
        .map((session: any) => ({
          id: session.id,
          kind: 'session' as const,
          title: session.title?.trim() || `Sesión ${session.sessionNumber ?? ''}`.trim(),
          sessionNumber: session.sessionNumber,
          date: session.realDate ?? session.updatedAt,
          summary: session.summary.trim(),
        })),
      ...stories
        .filter((story: any) => typeof story.sharedSummary === 'string' && story.sharedSummary.trim())
        .map((story: any) => ({
          id: story.id,
          kind: 'story' as const,
          title: story.title,
          sessionNumber: null,
          date: story.completedAt,
          summary: story.sharedSummary.trim(),
        })),
    ].sort((left, right) => {
      const leftTime = left.date ? new Date(left.date).getTime() : 0
      const rightTime = right.date ? new Date(right.date).getTime() : 0
      return leftTime - rightTime || left.title.localeCompare(right.title, 'es')
    })

    return {
      chronicle,
      items: items.map((item) => ({
        ...item,
        date: item.date instanceof Date ? item.date.toISOString() : item.date,
      })),
    }
  }
}
