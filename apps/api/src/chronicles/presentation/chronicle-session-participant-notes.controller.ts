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

const participantNotebookNotes = {
  private: {
    tag: 'SESSION_PARTICIPANT_PRIVATE',
    title: 'Notas privadas de la sesión',
    visibility: 'PRIVATE' as const,
  },
  shared: {
    tag: 'SESSION_PARTICIPANT_SHARED',
    title: 'Notas compartidas de la sesión',
    visibility: 'CHRONICLE' as const,
  },
} as const

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

  private async syncNotebookNote(
    database: any,
    input: {
      readonly chronicleId: string
      readonly sessionId: string
      readonly authorUserId: string
      readonly kind: 'private' | 'shared'
      readonly content: string | null
    },
  ) {
    const definition = participantNotebookNotes[input.kind]
    const matches = await database.chronicleNote.findMany({
      where: {
        chronicleId: input.chronicleId,
        sessionId: input.sessionId,
        authorUserId: input.authorUserId,
        tags: { has: definition.tag },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true, status: true },
    })
    const companion = matches[0]

    if (input.content !== null) {
      if (companion) {
        await database.chronicleNote.update({
          where: { id: companion.id },
          data: {
            title: definition.title,
            content: input.content,
            visibility: definition.visibility,
            status: 'ACTIVE',
            tags: [definition.tag],
            revision: { increment: 1 },
          },
        })
      } else {
        await database.chronicleNote.create({
          data: {
            chronicleId: input.chronicleId,
            sessionId: input.sessionId,
            authorUserId: input.authorUserId,
            title: definition.title,
            content: input.content,
            visibility: definition.visibility,
            tags: [definition.tag],
          },
        })
      }
    } else {
      for (const match of matches) {
        if (match.status === 'ACTIVE') {
          await database.chronicleNote.update({
            where: { id: match.id },
            data: { status: 'ARCHIVED', revision: { increment: 1 } },
          })
        }
      }
    }

    if (input.content !== null) {
      for (const duplicate of matches.slice(1)) {
        if (duplicate.status === 'ACTIVE') {
          await database.chronicleNote.update({
            where: { id: duplicate.id },
            data: { status: 'ARCHIVED', revision: { increment: 1 } },
          })
        }
      }
    }
  }

  private async syncNotebookNotes(
    database: any,
    input: {
      readonly chronicleId: string
      readonly sessionId: string
      readonly authorUserId: string
      readonly privateNotes: string | null
      readonly publicNotes: string | null
      readonly privateChanged: boolean
      readonly publicChanged: boolean
    },
  ) {
    const operations: Array<Promise<void>> = []
    if (input.privateChanged) {
      operations.push(this.syncNotebookNote(database, {
        ...input,
        kind: 'private',
        content: input.privateNotes,
      }))
    }
    if (input.publicChanged) {
      operations.push(this.syncNotebookNote(database, {
        ...input,
        kind: 'shared',
        content: input.publicNotes,
      }))
    }
    await Promise.all(operations)
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
    await this.database.$transaction(async (database: any) => {
      const existing = await database.chronicleSessionParticipantNote.findUnique({
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
          await database.chronicleSessionParticipantNote.create({
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

        const updated = await database.chronicleSessionParticipantNote.updateMany({
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

      const current = await database.chronicleSessionParticipantNote.findUnique({
        where: {
          sessionId_authorUserId: {
            sessionId: access.sessionId,
            authorUserId: access.actorUserId,
          },
        },
        select: { privateNotes: true, publicNotes: true },
      })

      if (!current) {
        throw new ConflictException({ code: 'CHRONICLE_SESSION_NOTE_REVISION_CONFLICT' })
      }

      await this.syncNotebookNotes(database, {
        chronicleId: access.chronicleId,
        sessionId: access.sessionId,
        authorUserId: access.actorUserId,
        privateNotes: current.privateNotes,
        publicNotes: current.publicNotes,
        privateChanged: data.privateNotes !== undefined,
        publicChanged: data.publicNotes !== undefined,
      })
    })

    return this.snapshot(access.chronicleId, access.sessionId, access.actorUserId)
  }
}
