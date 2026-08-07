import type {
  UserRole,
} from '../../auth/domain/auth.types'

import type {
  CreateUserAdministrationInput,
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

export function parseAuthenticatedAdministratorId(
  value: unknown,
): string {
  const id =
    stringValue(
      value,
      'request.user.id',
    )

  if (!uuidPattern.test(id)) {
    throw new InvalidUserAdministrationRequestError(
      'request.user.id',
      'must be a UUID',
    )
  }

  return id
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
