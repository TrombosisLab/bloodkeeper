import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidUserAdministrationError,
  normalizeUserAdministrationInput,
} from '../dist/users/domain/user-administration.rules.js'

test(
  '016-A normaliza datos y ordena roles canónicos',
  () => {
    assert.deepEqual(
      normalizeUserAdministrationInput({
        username: '  Jugador.Uno  ',
        displayName:
          '  Jugador Uno  ',
        password:
          'contraseña-segura-016',
        roles: [
          'player',
          'narrator',
        ],
      }),
      {
        username: 'jugador.uno',
        displayName: 'Jugador Uno',
        password:
          'contraseña-segura-016',
        roles: [
          'narrator',
          'player',
        ],
      },
    )
  },
)

test(
  '016-A comparte reglas de usuario y exige roles válidos',
  () => {
    assert.throws(
      () =>
        normalizeUserAdministrationInput({
          username: 'A',
          displayName: ' ',
          password: 'corta',
          roles: [],
        }),
      (error) =>
        error instanceof
          InvalidUserAdministrationError &&
        error.issues.length === 4,
    )

    assert.throws(
      () =>
        normalizeUserAdministrationInput({
          username: 'jugador',
          displayName: 'Jugador',
          password:
            'contraseña-segura-016',
          roles: [
            'player',
            'player',
          ],
        }),
      (error) =>
        error instanceof
          InvalidUserAdministrationError &&
        error.issues.some(
          (issue) =>
            issue.code ===
            'USER_ROLE_DUPLICATED',
        ),
    )
  },
)
