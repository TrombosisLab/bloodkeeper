import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { BackupRequestController } from './backup-request.controller'
import { BackupRequestService } from './backup-request.service'
import { BackupStatusController } from './backup-status.controller'
import { BackupStatusService } from './backup-status.service'
import { SystemOperationsController } from './system-operations.controller'
import { LifecycleTrashController } from './lifecycle-trash.controller'
import { LifecycleTrashService } from './lifecycle-trash.service'
import { StorageUsageController } from './storage-usage.controller'

@Module({
  imports: [DatabaseModule],
  controllers: [
    SystemOperationsController,
    BackupStatusController,
    BackupRequestController,
    LifecycleTrashController,
    StorageUsageController,
  ],
  providers: [
    BackupStatusService,
    BackupRequestService,
    LifecycleTrashService,
  ],
})
export class SystemOperationsModule {}
