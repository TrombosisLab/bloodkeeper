import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'

import {
  InvalidOffsetPaginationQueryError,
  parseOffsetPaginationQuery,
} from '../../common/offset-pagination'

import type {
  OffsetPage,
} from '../../common/offset-pagination'

import {
  CreateUserUseCase,
  UserAlreadyExistsError,
} from '../application/create-user.use-case'

import {
  ListUsersUseCase,
} from '../application/list-users.use-case'

import {
  UpdateUserUseCase,
  UserAdministrationUserNotFoundError,
} from '../application/update-user.use-case'

import {
  ResetUserCredentialsUseCase,
} from '../application/reset-user-credentials.use-case'

import {
  UpdateUserRolesUseCase,
} from '../application/update-user-roles.use-case'

import {
  InvalidAuthUserError,
} from '../../auth/domain/auth-user.rules'

import {
  writeAdministrationAuditEvent,
} from '../../administration/audit-log'

import {
  InvalidUserAdministrationError,
} from '../domain/user-administration.rules'

import {
  InvalidUserAdministrationRequestError,
  parseAuthenticatedAdministratorId,
  parseCreateUserAdministrationRequest,
  parseResetUserCredentialsRequest,
  parseSelfRegistrationRequest,
  parseUpdateUserAdministrationRequest,
  parseUpdateUserRolesRequest,
  toSelfRegistrationResponse,
  toUserAdministrationResponse,
} from './user-administration.dto'

import type {
  SelfRegistrationResponseDto,
  UserAdministrationResponseDto,
} from './user-administration.dto'

export interface AuthenticatedUserAdministrationRequest {
  readonly user?: {
    readonly id?: unknown
    readonly roles?: unknown
  }
}

function assertAdministrator(
  request:
    AuthenticatedUserAdministrationRequest,
): string {
  let administratorId: string

  try {
    administratorId =
      parseAuthenticatedAdministratorId(
        request.user?.id,
      )
  } catch {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }

  const roles = request.user?.roles

  if (
    !Array.isArray(roles) ||
    !roles.includes('admin')
  ) {
    throw new ForbiddenException({
      code:
        'USER_ADMINISTRATION_PERMISSION_DENIED',
    })
  }

  return administratorId
}

function throwUserAdministrationHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidOffsetPaginationQueryError
  ) {
    throw new BadRequestException({
      code: 'INVALID_PAGINATION_QUERY',
      field: error.field,
    })
  }

  if (
    error instanceof
      InvalidUserAdministrationRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_USER_ADMINISTRATION_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      InvalidAuthUserError
  ) {
    throw new UnprocessableEntityException({
      code:
        'USER_ADMINISTRATION_RULE_VIOLATION',
      violations: error.issues,
    })
  }

  if (
    error instanceof
      InvalidUserAdministrationError
  ) {
    throw new UnprocessableEntityException({
      code:
        'USER_ADMINISTRATION_RULE_VIOLATION',
      violations: error.issues,
    })
  }

  if (
    error instanceof
      UserAlreadyExistsError
  ) {
    throw new ConflictException({
      code: 'USERNAME_ALREADY_EXISTS',
      message:
        'Ya existe una cuenta con ese nombre de usuario.',
    })
  }

  if (
    error instanceof
      UserAdministrationUserNotFoundError
  ) {
    throw new NotFoundException({
      code: 'USER_NOT_FOUND',
    })
  }

  throw error
}

@Controller('users')
export class UserAdministrationController {
  constructor(
    private readonly createUser:
      CreateUserUseCase,
    private readonly listUsers:
      ListUsersUseCase,
    private readonly updateUser:
      UpdateUserUseCase,
    private readonly resetUserCredentials:
      ResetUserCredentialsUseCase,
    private readonly updateUserRoles:
      UpdateUserRolesUseCase,
  ) {}

  @Post('register')
  async register(
    @Body() body: unknown,
  ): Promise<SelfRegistrationResponseDto> {
    try {
      const command =
        parseSelfRegistrationRequest(body)

      const user =
        await this.createUser.execute(
          command,
        )

      return toSelfRegistrationResponse(
        user,
      )
    } catch (error: unknown) {
      throwUserAdministrationHttpError(
        error,
      )
    }
  }

  @Post()
  async create(
    @Req() request:
      AuthenticatedUserAdministrationRequest,
    @Body() body: unknown,
  ): Promise<UserAdministrationResponseDto> {
    const administratorId =
      assertAdministrator(request)

    try {
      const command =
        parseCreateUserAdministrationRequest(
          body,
        )

      const user =
        await this.createUser.execute(
          command,
        )

      writeAdministrationAuditEvent({
        action: 'user.admin.create',
        actorId: administratorId,
        targetId: user.id,
      })

      return toUserAdministrationResponse(
        user,
      )
    } catch (error: unknown) {
      throwUserAdministrationHttpError(
        error,
      )
    }
  }

  @Get()
  async list(
    @Req() request:
      AuthenticatedUserAdministrationRequest,
    @Query() queryInput:
      Record<string, unknown> = {},
  ): Promise<
    OffsetPage<UserAdministrationResponseDto>
  > {
    assertAdministrator(request)

    try {
      const query =
        parseOffsetPaginationQuery({
          limit: queryInput.limit,
          offset: queryInput.offset,
        })

      const page =
        await this.listUsers.execute(
          query,
        )

      return {
        items: page.items.map(
          toUserAdministrationResponse,
        ),
        nextOffset:
          page.nextOffset,
      }
    } catch (error: unknown) {
      throwUserAdministrationHttpError(
        error,
      )
    }
  }

  @Patch(':userId')
  async update(
    @Req() request:
      AuthenticatedUserAdministrationRequest,
    @Param('userId') userIdInput: unknown,
    @Body() body: unknown,
  ): Promise<UserAdministrationResponseDto> {
    const administratorId =
      assertAdministrator(request)

    try {
      const command =
        parseUpdateUserAdministrationRequest(
          userIdInput,
          body,
        )

      const user =
        await this.updateUser.execute(
          command,
        )

      writeAdministrationAuditEvent({
        action: 'user.admin.update',
        actorId: administratorId,
        targetId: user.id,
      })

      return toUserAdministrationResponse(
        user,
      )
    } catch (error: unknown) {
      throwUserAdministrationHttpError(
        error,
      )
    }
  }

  @Patch(':userId/roles')
  async updateRoles(
    @Req() request:
      AuthenticatedUserAdministrationRequest,
    @Param('userId') userIdInput: unknown,
    @Body() body: unknown,
  ): Promise<UserAdministrationResponseDto> {
    const administratorId =
      assertAdministrator(request)

    try {
      const command =
        parseUpdateUserRolesRequest(
          userIdInput,
          body,
        )

      const user =
        await this.updateUserRoles.execute(
          command,
        )

      writeAdministrationAuditEvent({
        action:
          'user.admin.roles.update',
        actorId: administratorId,
        targetId: user.id,
      })

      return toUserAdministrationResponse(
        user,
      )
    } catch (error: unknown) {
      throwUserAdministrationHttpError(
        error,
      )
    }
  }

  @Patch(':userId/credentials')
  async resetCredentials(
    @Req() request:
      AuthenticatedUserAdministrationRequest,
    @Param('userId') userIdInput: unknown,
    @Body() body: unknown,
  ): Promise<UserAdministrationResponseDto> {
    const administratorId =
      assertAdministrator(request)

    try {
      const command =
        parseResetUserCredentialsRequest(
          userIdInput,
          body,
        )

      const user =
        await this.resetUserCredentials.execute(
          command,
        )

      writeAdministrationAuditEvent({
        action:
          'user.admin.credentials.reset',
        actorId: administratorId,
        targetId: user.id,
      })

      return toUserAdministrationResponse(
        user,
      )
    } catch (error: unknown) {
      throwUserAdministrationHttpError(
        error,
      )
    }
  }
}
