import { Controller, ForbiddenException, Get, Req, UnauthorizedException } from '@nestjs/common'
import { BackupStatusService, type BackupStatusResponse } from './backup-status.service'

interface BackupStatusRequest {
  readonly user?: { readonly id?: unknown; readonly roles?: unknown }
}

function assertAdministrator(request: BackupStatusRequest): void {
  if (typeof request.user?.id !== 'string' || request.user.id.length === 0) {
    throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
  }
  const roles = request.user.roles
  if (!Array.isArray(roles) || !roles.includes('admin')) {
    throw new ForbiddenException({ code: 'BACKUP_STATUS_PERMISSION_DENIED' })
  }
}

@Controller('administration/backups')
export class BackupStatusController {
  constructor(private readonly backupStatus: BackupStatusService) {}

  @Get('status')
  async status(@Req() request: BackupStatusRequest): Promise<BackupStatusResponse> {
    assertAdministrator(request)
    return await this.backupStatus.readStatus()
  }
}
