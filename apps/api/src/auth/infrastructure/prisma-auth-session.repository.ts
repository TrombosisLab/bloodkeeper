import type {
  AuthSession as PrismaAuthSession,
} from '@prisma/client'

import {
  DatabaseService,
} from '../../database/database.service'

import type {
  AuthSessionRepository,
} from '../application/auth-session.repository'

import type {
  AuthSession,
  CreateAuthSessionData,
} from '../domain/auth-session.types'

function toDomain(
  row: PrismaAuthSession,
): AuthSession {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    expiresAt:
      new Date(row.expiresAt),
    createdAt:
      new Date(row.createdAt),
    lastSeenAt:
      new Date(row.lastSeenAt),
    revokedAt:
      row.revokedAt === null
        ? null
        : new Date(row.revokedAt),
  }
}

export class PrismaAuthSessionRepository
  implements AuthSessionRepository {
  constructor(
    private readonly database:
      DatabaseService,
  ) {}

  async create(
    data: CreateAuthSessionData,
  ): Promise<AuthSession> {
    const row =
      await this.database.authSession.create({
        data: {
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          createdAt: data.createdAt,
          lastSeenAt: data.createdAt,
        },
      })

    return toDomain(row)
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<AuthSession | null> {
    const row =
      await this.database.authSession.findUnique({
        where: {
          tokenHash,
        },
      })

    return row === null
      ? null
      : toDomain(row)
  }

  async markSeen(
    tokenHash: string,
    seenAt: Date,
  ): Promise<void> {
    await this.database.authSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },
      data: {
        lastSeenAt: seenAt,
      },
    })
  }

  async revokeByTokenHash(
    tokenHash: string,
    revokedAt: Date,
  ): Promise<boolean> {
    const result =
      await this.database.authSession.updateMany({
        where: {
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt,
        },
      })

    return result.count > 0
  }

  async revokeAllByUserId(
    userId: string,
    revokedAt: Date,
  ): Promise<number> {
    const result =
      await this.database.authSession.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt,
        },
      })

    return result.count
  }
}
