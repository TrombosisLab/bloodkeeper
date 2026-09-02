import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import { DatabaseService } from '../../database/database.service'
import {
  CHRONICLE_PARTICIPANT_REPOSITORY,
} from '../application/chronicle-participant.repository'
import type {
  ChronicleParticipantRepository,
} from '../application/chronicle-participant.repository'
import {
  parseChronicleIdParam,
  parseChronicleNarratorId,
} from './chronicle.dto'
import {
  parseChronicleSessionIdParam,
} from './chronicle-session.dto'

interface RequestWithUser {
  readonly user?: { readonly id?: unknown }
}

interface NotesPatch {
  readonly expectedRevision: number
  readonly privateNotes?: string | null
  readonly publicNotes?: string | null
}

@Controller('chronicles/:chronicleId/sessions/:sessionId/participant-notes')
export class ChronicleSessionParticipantNotesController {
  constructor(
    private readonly database: DatabaseService,
    @Inject(CHRONICLE_PARTICIPANT_REPOSITORY)
    private readonly participants: ChronicleParticipantRepository,
  ) {}

  private actor(request: RequestWithUser): string {
    try {
      return parseChronicleNarratorId(request.user?.id)
    } catch {
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
    }
  }

  private async access(
    request: RequestWithUser,
    chronicleIdInput: unknown,
    sessionIdInput: unknown,
  ) {
    const actorUserId = this.actor(request)
    const chronicleId = parseChronicleIdParam(chronicleIdInput)
    const sessionId = parseChronicleSessionIdParam(sessionIdInput)
    const membership = await this.participants.findActiveMembership(
      chronicleId,
      actorUserId,
    )

    if (membership === null) {
      throw new ForbiddenException({
        code: 'CHRONICLE_SESSION_NOTE_PERMISSION_DENIED',
      })
    }

    const session = await this.database.chronicleSession.findFirst({
      where: { id: sessionId, chronicleId },
      select: { id: true },
    })

    if (session === null) {
      throw new NotFoundException({ code: 'CHRONICLE_SESSION_NOT_FOUND' })
    }

    return { actorUserId, chronicleId, sessionId }
  }

  private text(value: unknown, field: string): string | null {
    if (value !== null && typeof value !== 'string') {
      throw new BadRequestException({
        code: 'INVALID_CHRONICLE_SESSION_NOTE_REQUEST',
        field,
      })
    }

    const normalized = typeof value === 'string' ? value.trim() : ''
    if (normalized.length > 20_000) {
      throw new BadRequestException({
        code: 'INVALID_CHRONICLE_SESSION_NOTE_REQUEST',
        field,
      })
    }

    return normalized || null
  }

  private payload(value: unknown): NotesPatch {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new BadRequestException({
        code: 'INVALID_CHRONICLE_SESSION_NOTE_REQUEST',
      })
    }

    const input = value as Record<string, unknown>
    const allowed = ['expectedRevision', 'privateNotes', 'publicNotes']
    if (Object.keys(input).some((key) => !allowed.includes(key))) {
      throw new BadRequestException({
        code: 'INVALID_CHRONICLE_SESSION_NOTE_REQUEST',
      })
    }

    if (
      !Number.isInteger(input.expectedRevision) ||
      Number(input.expectedRevision) < 0 ||
      (input.privateNotes === undefined && input.publicNotes === undefined)
    ) {
      throw new BadRequestException({
        code: 'INVALID_CHRONICLE_SESSION_NOTE_REQUEST',
      })
    }

    return {
      expectedRevision: Number(input.expectedRevision),
      ...(input.privateNotes === undefined
        ? {}
        : { privateNotes: this.text(input.privateNotes, 'privateNotes') }),
      ...(input.publicNotes === undefined
        ? {}
        : { publicNotes: this.text(input.publicNotes, 'publicNotes') }),
    }
  }

  private async snapshot(
    chronicleId: string,
    sessionId: string,
    actorUserId: string,
  ) {
    const [own, shared] = await Promise.all([
      this.database.chronicleSessionParticipantNote.findUnique({
        where: { sessionId_authorUserId: { sessionId, authorUserId: actorUserId } },
      }),
      this.database.chronicleSessionParticipantNote.findMany({
        where: { chronicleId, sessionId, publicNotes: { not: null } },
        include: { author: { select: { displayName: true, username: true } } },
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      }),
    ])

    return {
      privateNotes: own?.privateNotes ?? '',
      publicNotes: own?.publicNotes ?? '',
      revision: own?.revision ?? 0,
      sharedNotes: shared.map((note) => ({
        authorUserId: note.authorUserId,
        authorName: note.author.displayName || note.author.username,
        content: note.publicNotes ?? '',
        updatedAt: note.updatedAt.toISOString(),
      })),
    }
  }

  @Get()
  async load(
    @Req() request: RequestWithUser,
    @Param('chronicleId') chronicleIdInput: unknown,
    @Param('sessionId') sessionIdInput: unknown,
  ) {
    const access = await this.access(request, chronicleIdInput, sessionIdInput)
    return this.snapshot(access.chronicleId, access.sessionId, access.actorUserId)
  }

  @Patch()
  async update(
    @Req() request: RequestWithUser,
    @Param('chronicleId') chronicleIdInput: unknown,
    @Param('sessionId') sessionIdInput: unknown,
    @Body() body: unknown,
  ) {
    const access = await this.access(request, chronicleIdInput, sessionIdInput)
    const data = this.payload(body)
    const existing = await this.database.chronicleSessionParticipantNote.findUnique({
      where: {
        sessionId_authorUserId: {
          sessionId: access.sessionId,
          authorUserId: access.actorUserId,
        },
      },
    })

    if (existing === null) {
      if (data.expectedRevision !== 0) {
        throw new ConflictException({ code: 'CHRONICLE_SESSION_NOTE_REVISION_CONFLICT' })
      }

      try {
        await this.database.chronicleSessionParticipantNote.create({
          data: {
            chronicleId: access.chronicleId,
            sessionId: access.sessionId,
            authorUserId: access.actorUserId,
            privateNotes: data.privateNotes ?? null,
            publicNotes: data.publicNotes ?? null,
          },
        })
      } catch {
        throw new ConflictException({ code: 'CHRONICLE_SESSION_NOTE_REVISION_CONFLICT' })
      }
    } else {
      if (existing.revision !== data.expectedRevision) {
        throw new ConflictException({ code: 'CHRONICLE_SESSION_NOTE_REVISION_CONFLICT' })
      }

      const updated = await this.database.chronicleSessionParticipantNote.updateMany({
        where: { id: existing.id, revision: data.expectedRevision },
        data: {
          ...(data.privateNotes === undefined ? {} : { privateNotes: data.privateNotes }),
          ...(data.publicNotes === undefined ? {} : { publicNotes: data.publicNotes }),
          revision: { increment: 1 },
        },
      })

      if (updated.count !== 1) {
        throw new ConflictException({ code: 'CHRONICLE_SESSION_NOTE_REVISION_CONFLICT' })
      }
    }

    return this.snapshot(access.chronicleId, access.sessionId, access.actorUserId)
  }
}
