import {
  Module,
} from '@nestjs/common'

import {
  APP_INTERCEPTOR,
} from '@nestjs/core'

import {
  DatabaseService,
} from '../database/database.service'

import {
  LoginUseCase,
} from './application/login.use-case'

import {
  LogoutUseCase,
} from './application/logout.use-case'

import {
  ResolveSessionUseCase,
} from './application/resolve-session.use-case'

import {
  PrismaAuthSessionRepository,
} from './infrastructure/prisma-auth-session.repository'

import {
  PrismaAuthUserRepository,
} from './infrastructure/prisma-auth-user.repository'

import {
  ScryptPasswordHasher,
} from './infrastructure/scrypt-password-hasher'

import {
  Sha256SessionTokenService,
} from './infrastructure/sha256-session-token.service'

import {
  AuthController,
} from './presentation/auth.controller'

import {
  AuthSessionInterceptor,
} from './presentation/auth-session.interceptor'

@Module({
  controllers: [
    AuthController,
  ],
  providers: [
    {
      provide:
        PrismaAuthUserRepository,
      inject: [DatabaseService],
      useFactory: (
        database: DatabaseService,
      ) =>
        new PrismaAuthUserRepository(
          database,
        ),
    },
    {
      provide:
        PrismaAuthSessionRepository,
      inject: [DatabaseService],
      useFactory: (
        database: DatabaseService,
      ) =>
        new PrismaAuthSessionRepository(
          database,
        ),
    },
    {
      provide:
        ScryptPasswordHasher,
      useFactory: () =>
        new ScryptPasswordHasher(),
    },
    {
      provide:
        Sha256SessionTokenService,
      useFactory: () =>
        new Sha256SessionTokenService(),
    },
    {
      provide: LoginUseCase,
      inject: [
        PrismaAuthUserRepository,
        ScryptPasswordHasher,
        PrismaAuthSessionRepository,
        Sha256SessionTokenService,
      ],
      useFactory: (
        users:
          PrismaAuthUserRepository,
        passwords:
          ScryptPasswordHasher,
        sessions:
          PrismaAuthSessionRepository,
        tokens:
          Sha256SessionTokenService,
      ) =>
        new LoginUseCase(
          users,
          passwords,
          sessions,
          tokens,
        ),
    },
    {
      provide: LogoutUseCase,
      inject: [
        PrismaAuthSessionRepository,
        Sha256SessionTokenService,
      ],
      useFactory: (
        sessions:
          PrismaAuthSessionRepository,
        tokens:
          Sha256SessionTokenService,
      ) =>
        new LogoutUseCase(
          sessions,
          tokens,
        ),
    },
    {
      provide:
        ResolveSessionUseCase,
      inject: [
        PrismaAuthSessionRepository,
        PrismaAuthUserRepository,
        Sha256SessionTokenService,
      ],
      useFactory: (
        sessions:
          PrismaAuthSessionRepository,
        users:
          PrismaAuthUserRepository,
        tokens:
          Sha256SessionTokenService,
      ) =>
        new ResolveSessionUseCase(
          sessions,
          users,
          tokens,
        ),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass:
        AuthSessionInterceptor,
    },
  ],
  exports: [
    ResolveSessionUseCase,
  ],
})
export class AuthModule {}
