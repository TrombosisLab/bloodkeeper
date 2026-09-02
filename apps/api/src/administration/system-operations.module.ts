import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module'
import { BackupRequestController } from './backup-request.controller'
import { BackupRequestService } from './backup-request.service'
import { BackupStatusController } from './backup-status.controller'
import { BackupStatusService } from './backup-status.service'
import { SystemOperationsController } from './system-operations.controller'
import { LifecycleTrashController } from './lifecycle-trash.controller'
import { LifecycleTrashService } from './lifecycle-trash.service'

@Module({
  imports: [DatabaseModule],
  controllers: [
    SystemOperationsController,
    BackupStatusController,
    BackupRequestController,
    LifecycleTrashController,
  ],
  providers: [
    BackupStatusService,
    BackupRequestService,
    LifecycleTrashService,
  ],
})
export class SystemOperationsModule {}
