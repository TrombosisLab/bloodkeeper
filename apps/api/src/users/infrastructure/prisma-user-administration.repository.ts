import {
  Injectable,
} from '@nestjs/common'

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
  UserAdministrationRepository,
} from '../application/user-administration.repository'

import type {
  UserAccountStatus,
  UserRole,
} from '../../auth/domain/auth.types'

import type {
  CreateUserAdministrationData,
  UpdateUserAdministrationData,
  UserAdministrationRecord,
} from '../domain/user-administration.types'

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
): UserAdministrationRecord {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    status: statusFromPrisma[row.status],
    roles: row.roles.map(
      (role) => roleFromPrisma[role],
    ),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

@Injectable()
export class PrismaUserAdministrationRepository
  implements UserAdministrationRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async create(
    data: CreateUserAdministrationData,
  ): Promise<UserAdministrationRecord> {
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

  async findById(
    userId: string,
  ): Promise<UserAdministrationRecord | null> {
    const row =
      await this.database.user.findUnique({
        where: {
          id: userId,
        },
      })

    return row === null
      ? null
      : toDomain(row)
  }

  async findByUsername(
    username: string,
  ): Promise<UserAdministrationRecord | null> {
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

  async list(): Promise<
    readonly UserAdministrationRecord[]
  > {
    const rows =
      await this.database.user.findMany({
        orderBy: [
          {
            username: 'asc',
          },
          {
            id: 'asc',
          },
        ],
      })

    return rows.map(toDomain)
  }

  async update(
    userId: string,
    data: UpdateUserAdministrationData,
  ): Promise<UserAdministrationRecord> {
    const row =
      await this.database.user.update({
        where: {
          id: userId,
        },
        data: {
          username: data.username,
          displayName: data.displayName,
          status:
            statusToPrisma[data.status],
        },
      })

    return toDomain(row)
  }
}
