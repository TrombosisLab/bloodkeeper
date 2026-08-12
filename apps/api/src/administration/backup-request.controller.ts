import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import {
  BackupRequestAlreadyPendingError,
  BackupRequestService,
  BackupRequestUnavailableError,
} from './backup-request.service'

interface RequestContext {
  readonly user?: { readonly id?: unknown; readonly roles?: unknown }
}

function assertAdmin(request: RequestContext): void {
  if (typeof request.user?.id !== 'string' || request.user.id.length === 0) {
    throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
  }
  const roles = request.user.roles
  if (!Array.isArray(roles) || !roles.includes('admin')) {
    throw new ForbiddenException({ code: 'BACKUP_REQUEST_PERMISSION_DENIED' })
  }
}

function assertConfirmed(body: unknown): void {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException({ code: 'BACKUP_CONFIRMATION_REQUIRED' })
  }
  const value = body as Record<string, unknown>
  if (Object.keys(value).length !== 1 || value.confirm !== true) {
    throw new BadRequestException({ code: 'BACKUP_CONFIRMATION_REQUIRED' })
  }
}

@Controller('administration/backups')
export class BackupRequestController {
  constructor(private readonly backupRequest: BackupRequestService) {}

  @Post('requests')
  @HttpCode(HttpStatus.ACCEPTED)
  async request(
    @Req() request: RequestContext,
    @Body() body: unknown,
  ): Promise<{ readonly status: 'accepted' }> {
    assertAdmin(request)
    assertConfirmed(body)
    try {
      await this.backupRequest.request()
    } catch (error) {
      if (error instanceof BackupRequestAlreadyPendingError) {
        throw new ConflictException({ code: 'BACKUP_REQUEST_ALREADY_PENDING' })
      }
      if (error instanceof BackupRequestUnavailableError) {
        throw new ServiceUnavailableException({ code: 'BACKUP_REQUEST_UNAVAILABLE' })
      }
      throw error
    }
    return { status: 'accepted' }
  }
}
