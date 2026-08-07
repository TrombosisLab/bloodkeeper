import {
  AuthRecoveryUserNotFoundError,
  ResetUserPasswordUseCase,
} from '../application/reset-user-password.use-case'

import {
  InvalidAuthUserError,
} from '../domain/auth-user.rules'

import {
  PrismaAuthSessionRepository,
} from '../infrastructure/prisma-auth-session.repository'

import {
  PrismaAuthUserRepository,
} from '../infrastructure/prisma-auth-user.repository'

import {
  ScryptPasswordHasher,
} from '../infrastructure/scrypt-password-hasher'

import {
  DatabaseService,
} from '../../database/database.service'

function requiredEnvironment(
  name: string,
): string {
  const value = process.env[name]

  if (value === undefined) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    )
  }

  return value
}

async function main(): Promise<void> {
  const database =
    new DatabaseService()

  await database.$connect()

  try {
    const users =
      new PrismaAuthUserRepository(
        database,
      )
    const sessions =
      new PrismaAuthSessionRepository(
        database,
      )
    const passwordHasher =
      new ScryptPasswordHasher()
    const useCase =
      new ResetUserPasswordUseCase(
        users,
        sessions,
        passwordHasher,
      )

    const user =
      await useCase.execute({
        username:
          requiredEnvironment(
            'RECOVERY_USERNAME',
          ),
        password:
          requiredEnvironment(
            'RECOVERY_PASSWORD',
          ),
      })

    process.stdout.write(
      [
        'Acceso restablecido correctamente.',
        `Usuario: ${user.username}`,
        'Todas las sesiones anteriores han sido revocadas.',
      ].join('\n') + '\n',
    )
  } catch (error: unknown) {
    if (
      error instanceof
        AuthRecoveryUserNotFoundError
    ) {
      process.stderr.write(
        'No existe una cuenta con ese nombre de usuario.\n',
      )
      process.exitCode = 2
      return
    }

    if (
      error instanceof InvalidAuthUserError
    ) {
      for (const issue of error.issues) {
        process.stderr.write(
          `${issue.field}: ${issue.message}\n`,
        )
      }

      process.exitCode = 3
      return
    }

    throw error
  } finally {
    await database.$disconnect()
  }
}

void main()
