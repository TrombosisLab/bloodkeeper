import type {
  UserAccountStatus,
  UserRole,
} from '../../auth/domain/auth.types'

import type {
  CreateUserAdministrationInput,
  UpdateUserAdministrationInput,
  UserAdministrationRecord,
} from '../domain/user-administration.types'

type UnknownRecord =
  Record<string, unknown>

export interface UserAdministrationResponseDto {
  readonly id: string
  readonly username: string
  readonly displayName: string
  readonly status: 'active' | 'disabled'
  readonly roles:
    readonly UserRole[]
  readonly createdAt: string
  readonly updatedAt: string
}

export class InvalidUserAdministrationRequestError
  extends Error {
  constructor(
    path: string,
    expectation: string,
  ) {
    super(`${path} ${expectation}`)
    this.name =
      'InvalidUserAdministrationRequestError'
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const roles =
  new Set<UserRole>([
    'admin',
    'narrator',
    'player',
  ])

const statuses =
  new Set<UserAccountStatus>([
    'active',
    'disabled',
  ])

function record(
  value: unknown,
  path: string,
): UnknownRecord {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new InvalidUserAdministrationRequestError(
      path,
      'must be an object',
    )
  }

  return value as UnknownRecord
}

function onlyKeys(
  value: UnknownRecord,
  allowedKeys: readonly string[],
  path: string,
): void {
  const allowed =
    new Set(allowedKeys)

  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new InvalidUserAdministrationRequestError(
        `${path}.${key}`,
        'is not allowed',
      )
    }
  }
}

function required(
  value: UnknownRecord,
  key: string,
  path: string,
): unknown {
  if (!Object.hasOwn(value, key)) {
    throw new InvalidUserAdministrationRequestError(
      `${path}.${key}`,
      'is required',
    )
  }

  return value[key]
}

function stringValue(
  value: unknown,
  path: string,
): string {
  if (typeof value !== 'string') {
    throw new InvalidUserAdministrationRequestError(
      path,
      'must be a string',
    )
  }

  return value
}

function uuidValue(
  value: unknown,
  path: string,
): string {
  const id =
    stringValue(value, path)

  if (!uuidPattern.test(id)) {
    throw new InvalidUserAdministrationRequestError(
      path,
      'must be a UUID',
    )
  }

  return id
}

function statusValue(
  value: unknown,
  path: string,
): UserAccountStatus {
  if (
    typeof value !== 'string' ||
    !statuses.has(
      value as UserAccountStatus,
    )
  ) {
    throw new InvalidUserAdministrationRequestError(
      path,
      'must be active or disabled',
    )
  }

  return value as UserAccountStatus
}

export function parseAuthenticatedAdministratorId(
  value: unknown,
): string {
  return uuidValue(
    value,
    'request.user.id',
  )
}

export function parseUserAdministrationIdParam(
  value: unknown,
): string {
  return uuidValue(
    value,
    'params.userId',
  )
}

export function parseCreateUserAdministrationRequest(
  input: unknown,
): CreateUserAdministrationInput {
  const body = record(input, 'body')

  onlyKeys(
    body,
    [
      'username',
      'displayName',
      'password',
      'roles',
    ],
    'body',
  )

  const rolesInput =
    required(body, 'roles', 'body')

  if (!Array.isArray(rolesInput)) {
    throw new InvalidUserAdministrationRequestError(
      'body.roles',
      'must be an array',
    )
  }

  const parsedRoles:
    UserRole[] = []

  for (
    let index = 0;
    index < rolesInput.length;
    index += 1
  ) {
    const role =
      rolesInput[index]

    if (
      typeof role !== 'string' ||
      !roles.has(role as UserRole)
    ) {
      throw new InvalidUserAdministrationRequestError(
        `body.roles[${index}]`,
        'must be a supported role',
      )
    }

    parsedRoles.push(role as UserRole)
  }

  return {
    username: stringValue(
      required(body, 'username', 'body'),
      'body.username',
    ),
    displayName: stringValue(
      required(body, 'displayName', 'body'),
      'body.displayName',
    ),
    password: stringValue(
      required(body, 'password', 'body'),
      'body.password',
    ),
    roles: parsedRoles,
  }
}

export function parseUpdateUserAdministrationRequest(
  userIdInput: unknown,
  input: unknown,
): UpdateUserAdministrationInput {
  const userId =
    parseUserAdministrationIdParam(
      userIdInput,
    )
  const body = record(input, 'body')

  onlyKeys(
    body,
    [
      'username',
      'displayName',
      'status',
    ],
    'body',
  )

  if (Object.keys(body).length === 0) {
    throw new InvalidUserAdministrationRequestError(
      'body',
      'must contain at least one editable field',
    )
  }

  return {
    userId,
    ...(Object.hasOwn(
      body,
      'username',
    )
      ? {
          username: stringValue(
            body.username,
            'body.username',
          ),
        }
      : {}),
    ...(Object.hasOwn(
      body,
      'displayName',
    )
      ? {
          displayName: stringValue(
            body.displayName,
            'body.displayName',
          ),
        }
      : {}),
    ...(Object.hasOwn(
      body,
      'status',
    )
      ? {
          status: statusValue(
            body.status,
            'body.status',
          ),
        }
      : {}),
  }
}

export function toUserAdministrationResponse(
  user: UserAdministrationRecord,
): UserAdministrationResponseDto {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    status: user.status,
    roles: [...user.roles],
    createdAt:
      user.createdAt.toISOString(),
    updatedAt:
      user.updatedAt.toISOString(),
  }
}
