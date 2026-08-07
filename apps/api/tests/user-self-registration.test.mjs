import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const dto =
  await readFile(
    new URL(
      '../src/users/presentation/user-administration.dto.ts',
      import.meta.url,
    ),
    'utf8',
  )

const controller =
  await readFile(
    new URL(
      '../src/users/presentation/user-administration.controller.ts',
      import.meta.url,
    ),
    'utf8',
  )

const createUser =
  await readFile(
    new URL(
      '../src/users/application/create-user.use-case.ts',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '016-C publica un autorregistro separado y público',
  () => {
    assert.match(
      controller,
      /@Post\('register'\)/,
    )

    const start =
      controller.indexOf(
        "@Post('register')",
      )
    const end =
      controller.indexOf(
        '@Post()',
        start,
      )
    const registration =
      controller.slice(start, end)

    assert.doesNotMatch(
      registration,
      /assertAdministrator/,
    )
    assert.match(
      registration,
      /parseSelfRegistrationRequest/,
    )
  },
)

test(
  '016-C acepta únicamente identidad y contraseña',
  () => {
    const start =
      dto.indexOf(
        'export function parseSelfRegistrationRequest',
      )
    const end =
      dto.indexOf(
        'export function toSelfRegistrationResponse',
        start,
      )
    const registration =
      dto.slice(start, end)

    assert.match(
      registration,
      /'username'/,
    )
    assert.match(
      registration,
      /'displayName'/,
    )
    assert.match(
      registration,
      /'password'/,
    )
    assert.match(
      registration,
      /roles:\s*\['player'\]/,
    )
    assert.doesNotMatch(
      registration,
      /'admin'/,
    )
    assert.doesNotMatch(
      registration,
      /'narrator'/,
    )
    assert.doesNotMatch(
      registration,
      /'status'/,
    )
  },
)

test(
  '016-C reutiliza la creación segura activa existente',
  () => {
    assert.match(
      createUser,
      /normalizeUserAdministrationInput/,
    )
    assert.match(
      createUser,
      /passwords\.hash/,
    )
    assert.match(
      createUser,
      /status:\s*'active'/,
    )
    assert.match(
      createUser,
      /roles:\s*normalized\.roles/,
    )
  },
)

test(
  '016-C no expone datos técnicos en su respuesta pública',
  () => {
    const start =
      dto.indexOf(
        'export function toSelfRegistrationResponse',
      )
    const response =
      dto.slice(start)

    assert.match(
      response,
      /username:\s*user\.username/,
    )
    assert.match(
      response,
      /displayName:\s*user\.displayName/,
    )
    assert.doesNotMatch(
      response,
      /passwordHash/,
    )
    assert.doesNotMatch(
      response,
      /createdAt/,
    )
    assert.doesNotMatch(
      response,
      /updatedAt/,
    )
    assert.doesNotMatch(
      response,
      /roles:\s*user\.roles/,
    )
  },
)
