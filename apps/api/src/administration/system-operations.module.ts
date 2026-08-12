import { Module } from '@nestjs/common'
import { BackupRequestController } from './backup-request.controller'
import { BackupRequestService } from './backup-request.service'
import { BackupStatusController } from './backup-status.controller'
import { BackupStatusService } from './backup-status.service'
import { SystemOperationsController } from './system-operations.controller'

@Module({
  controllers: [
    SystemOperationsController,
    BackupStatusController,
    BackupRequestController,
  ],
  providers: [BackupStatusService, BackupRequestService],
})
export class SystemOperationsModule {}
