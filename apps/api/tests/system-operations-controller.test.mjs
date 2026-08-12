import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  SystemOperationsController,
} from '../dist/administration/system-operations.controller.js'

function adminRequest() {
  return {
    user: {
      id:
        '10000000-0000-4000-8000-000000000001',
      roles: ['admin'],
    },
  }
}

function hasStatus(status) {
  return (error) => {
    assert.equal(error.getStatus(), status)
    return true
  }
}

test(
  '041-A publica diagnóstico administrativo de solo lectura',
  () => {
    assert.equal(
      Reflect.getMetadata(
        'path',
        SystemOperationsController,
      ),
      'administration/system',
    )

    const handler =
      SystemOperationsController
        .prototype.diagnostics

    assert.equal(
      Reflect.getMetadata('path', handler),
      'diagnostics',
    )
    assert.equal(
      Reflect.getMetadata('method', handler),
      RequestMethod.GET,
    )
  },
)

test(
  '041-A exige sesión y rol administrador',
  async () => {
    const controller =
      new SystemOperationsController({
        async isHealthy() {
          throw new Error('unexpected')
        },
      })

    await assert.rejects(
      controller.diagnostics({}),
      hasStatus(401),
    )

    await assert.rejects(
      controller.diagnostics({
        user: {
          id:
            '10000000-0000-4000-8000-000000000001',
          roles: ['narrator'],
        },
      }),
      hasStatus(403),
    )
  },
)

test(
  '041-A informa API base de datos versión y mantenimiento SSH sin secretos',
  async () => {
    const previousVersion =
      process.env.npm_package_version
    process.env.npm_package_version =
      '0.1.0-test'

    try {
      const controller =
        new SystemOperationsController({
          async isHealthy() {
            return true
          },
        })

      const result =
        await controller.diagnostics(
          adminRequest(),
        )

      assert.equal(result.status, 'ok')
      assert.equal(result.services.api, 'ok')
      assert.equal(
        result.services.database,
        'ok',
      )
      assert.equal(
        result.version,
        '0.1.0-test',
      )
      assert.equal(
        result.hostMaintenance,
        'ssh-only',
      )
      assert.equal(
        JSON.stringify(result).includes(
          'DATABASE_URL',
        ),
        false,
      )
    } finally {
      if (previousVersion === undefined) {
        delete process.env.npm_package_version
      } else {
        process.env.npm_package_version =
          previousVersion
      }
    }
  },
)

test(
  '041-A degrada el diagnóstico si PostgreSQL no responde',
  async () => {
    const controller =
      new SystemOperationsController({
        async isHealthy() {
          return false
        },
      })

    const result =
      await controller.diagnostics(
        adminRequest(),
      )

    assert.equal(result.status, 'degraded')
    assert.equal(
      result.services.database,
      'unavailable',
    )
  },
)
