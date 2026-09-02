import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import { writeAdministrationAuditEvent } from './audit-log'
import {
  LifecycleTrashConfirmationError,
  LifecycleTrashConflictError,
  LifecycleTrashNotFoundError,
  LifecycleTrashService,
} from './lifecycle-trash.service'
import {
  lifecycleTrashKinds,
} from './lifecycle-trash.types'
import type {
  LifecycleTrashKind,
} from './lifecycle-trash.types'

interface AdministrationRequest {
  readonly user?: {
    readonly id?: unknown
    readonly roles?: unknown
  }
}

function administrator(request: AdministrationRequest): string {
  const id = request.user?.id
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
  }
  const roles = request.user?.roles
  if (!Array.isArray(roles) || !roles.includes('admin')) {
    throw new ForbiddenException({ code: 'LIFECYCLE_TRASH_PERMISSION_DENIED' })
  }
  return id
}

function kind(value: unknown): LifecycleTrashKind {
  if (typeof value !== 'string' || !lifecycleTrashKinds.includes(value as LifecycleTrashKind)) {
    throw new BadRequestException({ code: 'INVALID_LIFECYCLE_TRASH_KIND' })
  }
  return value as LifecycleTrashKind
}

function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new BadRequestException({ code: 'INVALID_LIFECYCLE_TRASH_ID' })
  }
  return value
}

function optionalDate(value: unknown, endOfDay: boolean): Date | undefined {
  if (value === undefined || value === '') return undefined
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException({ code: 'INVALID_LIFECYCLE_TRASH_DATE' })
  }
  const date = new Date(value + (endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'))
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException({ code: 'INVALID_LIFECYCLE_TRASH_DATE' })
  }
  return date
}

function failure(error: unknown): never {
  if (error instanceof LifecycleTrashNotFoundError) {
    throw new NotFoundException({ code: 'LIFECYCLE_TRASH_ITEM_NOT_FOUND' })
  }
  if (error instanceof LifecycleTrashConfirmationError) {
    throw new BadRequestException({ code: 'LIFECYCLE_TRASH_CONFIRMATION_MISMATCH' })
  }
  if (error instanceof LifecycleTrashConflictError) {
    throw new ConflictException({ code: 'LIFECYCLE_TRASH_CONFLICT', blockers: error.blockers })
  }
  throw error
}

@Controller('administration/lifecycle/trash')
export class LifecycleTrashController {
  constructor(private readonly lifecycle: LifecycleTrashService) {}

  @Get()
  async list(
    @Req() request: AdministrationRequest,
    @Query() query: Record<string, unknown>,
  ) {
    const actorId = administrator(request)
    const limit = query.limit === undefined ? 50 : Number(query.limit)
    const offset = query.offset === undefined ? 0 : Number(query.offset)
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
      throw new BadRequestException({ code: 'INVALID_PAGINATION_QUERY' })
    }
    return this.lifecycle.list({
      actorId,
      kind: query.kind === undefined || query.kind === '' ? undefined : kind(query.kind),
      query: typeof query.query === 'string' ? query.query : undefined,
      updatedFrom: optionalDate(query.updatedFrom, false),
      updatedTo: optionalDate(query.updatedTo, true),
      limit,
      offset,
    })
  }

  @Get(':kind/:id/dependencies')
  async dependencies(
    @Req() request: AdministrationRequest,
    @Param('kind') kindInput: unknown,
    @Param('id') idInput: unknown,
  ) {
    const actorId = administrator(request)
    try {
      return await this.lifecycle.dependencies(actorId, kind(kindInput), identifier(idInput))
    } catch (error: unknown) {
      failure(error)
    }
  }

  @Patch(':kind/:id/restore')
  async restore(
    @Req() request: AdministrationRequest,
    @Param('kind') kindInput: unknown,
    @Param('id') idInput: unknown,
  ) {
    const actorId = administrator(request)
    const parsedKind = kind(kindInput)
    const id = identifier(idInput)
    try {
      await this.lifecycle.restore(actorId, parsedKind, id)
      writeAdministrationAuditEvent({
        action: ('lifecycle.' + parsedKind + '.restore') as Parameters<typeof writeAdministrationAuditEvent>[0]['action'],
        actorId,
        targetId: id,
      })
      return { restored: true }
    } catch (error: unknown) {
      failure(error)
    }
  }

  @Delete(':kind/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async purge(
    @Req() request: AdministrationRequest,
    @Param('kind') kindInput: unknown,
    @Param('id') idInput: unknown,
    @Body() body: unknown,
  ): Promise<void> {
    const actorId = administrator(request)
    const parsedKind = kind(kindInput)
    const id = identifier(idInput)
    const confirmation = (body as { readonly confirmation?: unknown } | null)?.confirmation
    if (typeof confirmation !== 'string') {
      throw new BadRequestException({ code: 'LIFECYCLE_TRASH_CONFIRMATION_REQUIRED' })
    }
    try {
      await this.lifecycle.purge(actorId, parsedKind, id, confirmation)
      writeAdministrationAuditEvent({
        action: ('lifecycle.' + parsedKind + '.purge') as Parameters<typeof writeAdministrationAuditEvent>[0]['action'],
        actorId,
        targetId: id,
      })
    } catch (error: unknown) {
      failure(error)
    }
  }
}
