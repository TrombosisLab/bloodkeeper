import {
  Module,
} from '@nestjs/common'

import {
  DatabaseModule,
} from '../database/database.module'

import {
  DatabaseService,
} from '../database/database.service'

import {
  PrismaAuthSessionRepository,
} from '../auth/infrastructure/prisma-auth-session.repository'

import {
  PrismaAuthUserRepository,
} from '../auth/infrastructure/prisma-auth-user.repository'

import {
  ScryptPasswordHasher,
} from '../auth/infrastructure/scrypt-password-hasher'

import {
  ResetUserPasswordUseCase,
} from '../auth/application/reset-user-password.use-case'

import {
  CreateUserUseCase,
} from './application/create-user.use-case'

import {
  ListUsersUseCase,
} from './application/list-users.use-case'

import {
  UpdateUserUseCase,
} from './application/update-user.use-case'

import {
  ResetUserCredentialsUseCase,
} from './application/reset-user-credentials.use-case'

import {
  UpdateUserRolesUseCase,
} from './application/update-user-roles.use-case'

import {
  USER_ADMINISTRATION_REPOSITORY,
} from './application/user-administration.repository'

import type {
  UserAdministrationRepository,
} from './application/user-administration.repository'

import {
  PrismaUserAdministrationRepository,
} from './infrastructure/prisma-user-administration.repository'

import {
  UserAdministrationController,
} from './presentation/user-administration.controller'

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [
    UserAdministrationController,
  ],
  providers: [
    PrismaUserAdministrationRepository,
    ScryptPasswordHasher,
    {
      provide:
        PrismaAuthUserRepository,
      inject: [
        DatabaseService,
      ],
      useFactory: (
        database:
          DatabaseService,
      ) =>
        new PrismaAuthUserRepository(
          database,
        ),
    },
    {
      provide:
        PrismaAuthSessionRepository,
      inject: [
        DatabaseService,
      ],
      useFactory: (
        database:
          DatabaseService,
      ) =>
        new PrismaAuthSessionRepository(
          database,
        ),
    },
    {
      provide:
        ResetUserPasswordUseCase,
      inject: [
        PrismaAuthUserRepository,
        PrismaAuthSessionRepository,
        ScryptPasswordHasher,
      ],
      useFactory: (
        users:
          PrismaAuthUserRepository,
        sessions:
          PrismaAuthSessionRepository,
        passwords:
          ScryptPasswordHasher,
      ) =>
        new ResetUserPasswordUseCase(
          users,
          sessions,
          passwords,
        ),
    },
    {
      provide:
        USER_ADMINISTRATION_REPOSITORY,
      useExisting:
        PrismaUserAdministrationRepository,
    },
    {
      provide: CreateUserUseCase,
      inject: [
        USER_ADMINISTRATION_REPOSITORY,
        ScryptPasswordHasher,
      ],
      useFactory: (
        users:
          UserAdministrationRepository,
        passwords:
          ScryptPasswordHasher,
      ) =>
        new CreateUserUseCase(
          users,
          passwords,
        ),
    },
    {
      provide: ListUsersUseCase,
      inject: [
        USER_ADMINISTRATION_REPOSITORY,
      ],
      useFactory: (
        users:
          UserAdministrationRepository,
      ) =>
        new ListUsersUseCase(users),
    },
    {
      provide: UpdateUserUseCase,
      inject: [
        USER_ADMINISTRATION_REPOSITORY,
        PrismaAuthSessionRepository,
      ],
      useFactory: (
        users:
          UserAdministrationRepository,
        sessions:
          PrismaAuthSessionRepository,
      ) =>
        new UpdateUserUseCase(
          users,
          sessions,
        ),
    },
    {
      provide:
        UpdateUserRolesUseCase,
      inject: [
        USER_ADMINISTRATION_REPOSITORY,
      ],
      useFactory: (
        users:
          UserAdministrationRepository,
      ) =>
        new UpdateUserRolesUseCase(
          users,
        ),
    },
    {
      provide:
        ResetUserCredentialsUseCase,
      inject: [
        USER_ADMINISTRATION_REPOSITORY,
        ResetUserPasswordUseCase,
      ],
      useFactory: (
        users:
          UserAdministrationRepository,
        resetPassword:
          ResetUserPasswordUseCase,
      ) =>
        new ResetUserCredentialsUseCase(
          users,
          resetPassword,
        ),
    },
  ],
  exports: [
    CreateUserUseCase,
    ListUsersUseCase,
    UpdateUserUseCase,
    UpdateUserRolesUseCase,
    ResetUserCredentialsUseCase,
  ],
})
export class UsersModule {}
