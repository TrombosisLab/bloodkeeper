import assert from 'node:assert/strict'
import test, { afterEach } from 'node:test'

import {
  UserAdministrationApiError,
  createUserAdministrationGateway,
} from '../src/features/administration/infrastructure/user-administration.api.ts'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

const user = {
  id: '10000000-0000-4000-8000-000000000001',
  username: 'keeper',
  displayName: 'Keeper',
  status: 'active',
  roles: ['admin'],
  createdAt: '2026-08-12T00:00:00.000Z',
  updatedAt: '2026-08-12T00:00:00.000Z',
}

test('040-A lista usuarios con sesion y sin transformar el contrato', async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(
      url,
      '/api/users?limit=25&offset=0',
    )
    assert.equal(init.credentials, 'include')
    return Response.json({
      items: [user],
      nextOffset: null,
    })
  }
  assert.deepEqual(
    await createUserAdministrationGateway().list(),
    {
      items: [user],
      nextOffset: null,
    },
  )
})

test('040-A crea cuentas mediante la API administrativa existente', async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, '/api/users')
    assert.equal(init.method, 'POST')
    assert.deepEqual(JSON.parse(init.body), {
      username: 'player2', displayName: 'Player Two', password: 'password-123', roles: ['player'],
    })
    return Response.json(user)
  }
  await createUserAdministrationGateway().create({
    username: 'player2', displayName: 'Player Two', password: 'password-123', roles: ['player'],
  })
})

test('040-A usa endpoints separados para estado roles y credenciales', async () => {
  const calls = []
  globalThis.fetch = async (url, init) => {
    calls.push([url, init.method, JSON.parse(init.body)])
    return Response.json(user)
  }
  const gateway = createUserAdministrationGateway()
  await gateway.changeStatus(user.id, 'disabled')
  await gateway.changeRoles(user.id, ['player', 'narrator'])
  await gateway.resetPassword(user.id, 'new-password-123')
  assert.deepEqual(calls, [
    [`/api/users/${user.id}`, 'PATCH', { status: 'disabled' }],
    [`/api/users/${user.id}/roles`, 'PATCH', { roles: ['player', 'narrator'] }],
    [`/api/users/${user.id}/credentials`, 'PATCH', { password: 'new-password-123' }],
  ])
})

test('040-A conserva estado y codigo de los errores del backend', async () => {
  globalThis.fetch = async () => Response.json(
    { code: 'USER_ADMINISTRATION_PERMISSION_DENIED' },
    { status: 403 },
  )
  await assert.rejects(
    () => createUserAdministrationGateway().list(),
    error => error instanceof UserAdministrationApiError &&
      error.status === 403 &&
      error.code === 'USER_ADMINISTRATION_PERMISSION_DENIED',
  )
})
