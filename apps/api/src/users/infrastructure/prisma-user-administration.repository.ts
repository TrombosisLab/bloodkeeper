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

import {
  MAX_OFFSET_PAGE_LIMIT,
  offsetPageFromRows,
} from '../../common/offset-pagination'

import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

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

  list(): Promise<
    readonly UserAdministrationRecord[]
  >

  list(
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<UserAdministrationRecord>
  >

  async list(
    query?: OffsetPaginationQuery,
  ): Promise<
    | readonly UserAdministrationRecord[]
    | OffsetPage<UserAdministrationRecord>
  > {
    if (query !== undefined) {
      return this.listPage(query)
    }

    const items:
      UserAdministrationRecord[] = []

    let nextOffset: number | null = 0

    while (nextOffset !== null) {
      const page =
        await this.listPage({
          limit: MAX_OFFSET_PAGE_LIMIT,
          offset: nextOffset,
        })

      items.push(...page.items)
      nextOffset = page.nextOffset
    }

    return items
  }

  private async listPage(
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<UserAdministrationRecord>
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
        skip: query.offset,
        take: query.limit + 1,
      })

    const page =
      offsetPageFromRows(rows, query)

    return {
      items: page.items.map(toDomain),
      nextOffset: page.nextOffset,
    }
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

  async updateRoles(
    userId: string,
    roles: readonly UserRole[],
  ): Promise<UserAdministrationRecord> {
    const row =
      await this.database.user.update({
        where: {
          id: userId,
        },
        data: {
          roles: roles.map(
            (role) => roleToPrisma[role],
          ),
        },
      })

    return toDomain(row)
  }
}
