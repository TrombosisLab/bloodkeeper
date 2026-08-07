import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'

import {
  CreateUserUseCase,
  UserAlreadyExistsError,
} from '../application/create-user.use-case'

import {
  ListUsersUseCase,
} from '../application/list-users.use-case'

import {
  InvalidUserAdministrationError,
} from '../domain/user-administration.rules'

import {
  InvalidUserAdministrationRequestError,
  parseAuthenticatedAdministratorId,
  parseCreateUserAdministrationRequest,
  toUserAdministrationResponse,
} from './user-administration.dto'

import type {
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
): void {
  try {
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
}

function throwUserAdministrationHttpError(
  error: unknown,
): never {
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

  throw error
}

@Controller('users')
export class UserAdministrationController {
  constructor(
    private readonly createUser:
      CreateUserUseCase,
    private readonly listUsers:
      ListUsersUseCase,
  ) {}

  @Post()
  async create(
    @Req() request:
      AuthenticatedUserAdministrationRequest,
    @Body() body: unknown,
  ): Promise<UserAdministrationResponseDto> {
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
  ): Promise<
    readonly UserAdministrationResponseDto[]
  > {
    assertAdministrator(request)

    const users =
      await this.listUsers.execute()

    return users.map(
      toUserAdministrationResponse,
    )
  }
}
