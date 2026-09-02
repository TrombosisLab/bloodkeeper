import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { DatabaseService } from '../database/database.service'

interface StorageRequest {
  readonly user?: {
    readonly id?: unknown
    readonly roles?: unknown
  }
}

interface DatabaseSizeRow {
  readonly bytes: bigint | number | string
}

function administrator(request: StorageRequest): void {
  if (typeof request.user?.id !== 'string') {
    throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
  }
  if (!Array.isArray(request.user.roles) || !request.user.roles.includes('admin')) {
    throw new ForbiddenException({ code: 'STORAGE_USAGE_PERMISSION_DENIED' })
  }
}

async function directoryUsage(path: string): Promise<{
  bytes: number
  files: number
}> {
  try {
    const entries = await readdir(path, { withFileTypes: true })
    let bytes = 0
    let files = 0
    for (const entry of entries) {
      if (!entry.isFile() || entry.isSymbolicLink()) continue
      const metadata = await stat(join(path, entry.name))
      bytes += metadata.size
      files += 1
    }
    return { bytes, files }
  } catch {
    return { bytes: 0, files: 0 }
  }
}

@Controller('administration/system')
export class StorageUsageController {
  constructor(private readonly database: DatabaseService) {}

  @Get('storage')
  async storage(@Req() request: StorageRequest) {
    administrator(request)

    const [databaseRows, portraits, backups] = await Promise.all([
      this.database.$queryRaw<DatabaseSizeRow[]>`
        SELECT pg_database_size(current_database()) AS bytes
      `,
      this.database.characterPortrait.aggregate({
        _sum: { byteSize: true },
        _count: { characterId: true },
      }),
      directoryUsage(process.env.BACKUP_ARCHIVE_DIR ?? '/backups'),
    ])

    const databaseBytes = Number(databaseRows[0]?.bytes ?? 0)
    const portraitBytes = portraits._sum.byteSize ?? 0

    return {
      totalBytes: databaseBytes + backups.bytes,
      databaseBytes,
      portraitBytes,
      portraitCount: portraits._count.characterId,
      backupBytes: backups.bytes,
      backupFiles: backups.files,
      scope: 'managed-persistent-data',
      measuredAt: new Date().toISOString(),
    }
  }
}
