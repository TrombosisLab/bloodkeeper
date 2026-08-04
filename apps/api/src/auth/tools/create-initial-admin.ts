import {
  CreateInitialAdminUseCase,
  InitialAdminAlreadyExistsError,
} from '../application/create-initial-admin.use-case'

import {
  InvalidAuthUserError,
} from '../domain/auth-user.rules'

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
    const repository =
      new PrismaAuthUserRepository(
        database,
      )
    const passwordHasher =
      new ScryptPasswordHasher()
    const useCase =
      new CreateInitialAdminUseCase(
        repository,
        passwordHasher,
      )

    const user =
      await useCase.execute({
        username:
          requiredEnvironment(
            'ADMIN_USERNAME',
          ),
        displayName:
          requiredEnvironment(
            'ADMIN_DISPLAY_NAME',
          ),
        password:
          requiredEnvironment(
            'ADMIN_PASSWORD',
          ),
      })

    process.stdout.write(
      [
        'Administrador inicial creado.',
        `Usuario: ${user.username}`,
        `Nombre visible: ${user.displayName}`,
        `Identificador: ${user.id}`,
      ].join('\n') + '\n',
    )
  } catch (error: unknown) {
    if (
      error instanceof
        InitialAdminAlreadyExistsError
    ) {
      process.stderr.write(
        'Ya existe una cuenta con ese nombre de usuario.\n',
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
