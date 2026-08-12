import assert from 'node:assert/strict'
import test from 'node:test'
import {
  Logger,
} from '@nestjs/common'

import {
  formatAdministrationAuditEvent,
} from '../dist/administration/audit-log.js'

import {
  BackupRequestController,
} from '../dist/administration/backup-request.controller.js'

import {
  UserAdministrationController,
} from '../dist/users/presentation/user-administration.controller.js'

const actorId =
  '10000000-0000-4000-8000-000000000001'
const targetId =
  '20000000-0000-4000-8000-000000000002'

const adminRequest = {
  user: {
    id: actorId,
    roles: ['admin'],
  },
}

function user() {
  const now =
    new Date('2026-08-12T20:00:00.000Z')

  return {
    id: targetId,
    username: 'audit-target',
    displayName: 'Audit Target',
    status: 'active',
    roles: ['player'],
    createdAt: now,
    updatedAt: now,
  }
}

test(
  '043-B formatea auditoría HTTP sin payload libre ni saltos de línea',
  () => {
    const line =
      formatAdministrationAuditEvent({
        action:
          'backup.manual.request',
        actorId:
          `${actorId}\npassword=forbidden`,
      })

    assert.equal(
      line,
      '[AUDIT] action=backup.manual.request actorId=10000000-0000-4000-8000-000000000001_password_forbidden targetId=none outcome=success channel=http',
    )

    assert.doesNotMatch(
      line,
      /[\r\n]/,
    )
  },
)

test(
  '043-B registra sólo éxitos sensibles y nunca contraseñas',
  async () => {
    const messages = []
    const originalLog =
      Logger.prototype.log

    Logger.prototype.log =
      function log(message) {
        messages.push(
          String(message),
        )
      }

    try {
      const controller =
        new UserAdministrationController(
          {
            async execute() {
              return user()
            },
          },
          {
            async execute() {
              return [user()]
            },
          },
          {
            async execute() {
              return user()
            },
          },
          {
            async execute() {
              return user()
            },
          },
          {
            async execute() {
              return user()
            },
          },
        )

      await controller.create(
        adminRequest,
        {
          username: 'audit-target',
          displayName: 'Audit Target',
          password:
            'contraseña-segura-043',
          roles: ['player'],
        },
      )

      await controller.update(
        adminRequest,
        targetId,
        {
          status: 'disabled',
        },
      )

      await controller.updateRoles(
        adminRequest,
        targetId,
        {
          roles: ['narrator'],
        },
      )

      await controller.resetCredentials(
        adminRequest,
        targetId,
        {
          password:
            'otra-contraseña-segura-043',
        },
      )

      const backup =
        new BackupRequestController({
          async request() {},
        })

      await backup.request(
        adminRequest,
        { confirm: true },
      )

      assert.deepEqual(
        messages,
        [
          `[AUDIT] action=user.admin.create actorId=${actorId} targetId=${targetId} outcome=success channel=http`,
          `[AUDIT] action=user.admin.update actorId=${actorId} targetId=${targetId} outcome=success channel=http`,
          `[AUDIT] action=user.admin.roles.update actorId=${actorId} targetId=${targetId} outcome=success channel=http`,
          `[AUDIT] action=user.admin.credentials.reset actorId=${actorId} targetId=${targetId} outcome=success channel=http`,
          `[AUDIT] action=backup.manual.request actorId=${actorId} targetId=none outcome=success channel=http`,
        ],
      )

      assert.doesNotMatch(
        messages.join('\n'),
        /contraseña-segura-043|otra-contraseña-segura-043/,
      )

      const countBeforeFailure =
        messages.length

      const failing =
        new BackupRequestController({
          async request() {
            throw new Error(
              'controlled failure',
            )
          },
        })

      await assert.rejects(
        failing.request(
          adminRequest,
          { confirm: true },
        ),
      )

      assert.equal(
        messages.length,
        countBeforeFailure,
      )
    } finally {
      Logger.prototype.log =
        originalLog
    }
  },
)
