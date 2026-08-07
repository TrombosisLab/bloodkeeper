import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const moduleSource = await readFile(
  new URL(
    '../src/users/users.module.ts',
    import.meta.url,
  ),
  'utf8',
)

const appModule = await readFile(
  new URL(
    '../src/app.module.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '016-A registra repositorio casos de uso y controlador',
  () => {
    assert.match(
      moduleSource,
      /UserAdministrationController/,
    )
    assert.match(
      moduleSource,
      /USER_ADMINISTRATION_REPOSITORY/,
    )
    assert.match(
      moduleSource,
      /CreateUserUseCase/,
    )
    assert.match(
      moduleSource,
      /ListUsersUseCase/,
    )
    assert.match(
      moduleSource,
      /ScryptPasswordHasher/,
    )
  },
)

test(
  '016-A conecta UsersModule con la aplicación',
  () => {
    assert.match(
      appModule,
      /import \{ UsersModule \}/,
    )
    assert.match(
      appModule,
      /imports:[\s\S]*UsersModule/,
    )
  },
)
