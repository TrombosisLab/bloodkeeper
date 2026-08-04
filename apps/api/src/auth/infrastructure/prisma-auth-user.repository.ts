import {
  UserAccountStatus as PrismaUserStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client'

import type {
  User as PrismaUser,
} from '@prisma/client'

import {
  DatabaseService,
} from '../../database/database.service'

import type {
  AuthUserRepository,
} from '../application/auth-user.repository'

import type {
  AuthUser,
  CreateAuthUserData,
  UserAccountStatus,
  UserRole,
} from '../domain/auth.types'

const statusToPrisma = {
  active: PrismaUserStatus.ACTIVE,
  disabled: PrismaUserStatus.DISABLED,
} as const satisfies Record<
  UserAccountStatus,
  PrismaUserStatus
>

const statusFromPrisma = {
  [PrismaUserStatus.ACTIVE]: 'active',
  [PrismaUserStatus.DISABLED]: 'disabled',
} as const satisfies Record<
  PrismaUserStatus,
  UserAccountStatus
>

const roleToPrisma = {
  admin: PrismaUserRole.ADMIN,
  narrator: PrismaUserRole.NARRATOR,
  player: PrismaUserRole.PLAYER,
} as const satisfies Record<
  UserRole,
  PrismaUserRole
>

const roleFromPrisma = {
  [PrismaUserRole.ADMIN]: 'admin',
  [PrismaUserRole.NARRATOR]: 'narrator',
  [PrismaUserRole.PLAYER]: 'player',
} as const satisfies Record<
  PrismaUserRole,
  UserRole
>

function toDomain(
  row: PrismaUser,
): AuthUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    passwordHash: row.passwordHash,
    status: statusFromPrisma[row.status],
    roles: row.roles.map(
      (role) => roleFromPrisma[role],
    ),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

export class PrismaAuthUserRepository
  implements AuthUserRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async create(
    data: CreateAuthUserData,
  ): Promise<AuthUser> {
    const row =
      await this.database.user.create({
        data: {
          username: data.username,
          displayName: data.displayName,
          passwordHash: data.passwordHash,
          status:
            statusToPrisma[data.status],
          roles: data.roles.map(
            (role) => roleToPrisma[role],
          ),
        },
      })

    return toDomain(row)
  }

  async findByUsername(
    username: string,
  ): Promise<AuthUser | null> {
    const row =
      await this.database.user.findUnique({
        where: {
          username,
        },
      })

    return row === null
      ? null
      : toDomain(row)
  }
}
