import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import {
  DatabaseService,
} from '../database/database.service'

interface SystemOperationsRequest {
  readonly user?: {
    readonly id?: unknown
    readonly roles?: unknown
  }
}

type DiagnosticState =
  | 'ok'
  | 'unavailable'

export interface SystemOperationsDiagnosticsResponse {
  readonly status: 'ok' | 'degraded'
  readonly application: 'Vampiro V5 Revolution'
  readonly version: string
  readonly services: {
    readonly api: 'ok'
    readonly database: DiagnosticState
  }
  readonly hostMaintenance: 'ssh-only'
  readonly timestamp: string
}

function assertAdministrator(
  request: SystemOperationsRequest,
): void {
  if (
    typeof request.user?.id !== 'string' ||
    request.user.id.length === 0
  ) {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }

  const roles = request.user.roles

  if (
    !Array.isArray(roles) ||
    !roles.includes('admin')
  ) {
    throw new ForbiddenException({
      code:
        'SYSTEM_OPERATIONS_PERMISSION_DENIED',
    })
  }
}

@Controller('administration/system')
export class SystemOperationsController {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  @Get('diagnostics')
  async diagnostics(
    @Req() request: SystemOperationsRequest,
  ): Promise<SystemOperationsDiagnosticsResponse> {
    assertAdministrator(request)

    const databaseHealthy =
      await this.database.isHealthy()

    return {
      status:
        databaseHealthy ? 'ok' : 'degraded',
      application: 'Vampiro V5 Revolution',
      version:
        process.env.npm_package_version ??
        'unknown',
      services: {
        api: 'ok',
        database:
          databaseHealthy
            ? 'ok'
            : 'unavailable',
      },
      hostMaintenance: 'ssh-only',
      timestamp: new Date().toISOString(),
    }
  }
}
