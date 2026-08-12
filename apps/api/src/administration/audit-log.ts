import {
  Logger,
} from '@nestjs/common'

export type AdministrationAuditAction =
  | 'user.admin.create'
  | 'user.admin.update'
  | 'user.admin.roles.update'
  | 'user.admin.credentials.reset'
  | 'backup.manual.request'

export interface AdministrationAuditEvent {
  readonly action: AdministrationAuditAction
  readonly actorId: string
  readonly targetId?: string
}

const auditLogger =
  new Logger('Audit')

function safeIdentifier(
  value: string,
): string {
  return value
    .replace(
      /[^A-Za-z0-9_.:-]/g,
      '_',
    )
    .slice(0, 80)
}

export function formatAdministrationAuditEvent(
  event: AdministrationAuditEvent,
): string {
  return [
    '[AUDIT]',
    `action=${event.action}`,
    `actorId=${safeIdentifier(
      event.actorId,
    )}`,
    `targetId=${
      event.targetId === undefined
        ? 'none'
        : safeIdentifier(
            event.targetId,
          )
    }`,
    'outcome=success',
    'channel=http',
  ].join(' ')
}

export function writeAdministrationAuditEvent(
  event: AdministrationAuditEvent,
): void {
  auditLogger.log(
    formatAdministrationAuditEvent(
      event,
    ),
  )
}
