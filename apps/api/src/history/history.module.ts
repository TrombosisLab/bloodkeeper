import { Module } from '@nestjs/common'

import { GlobalHistoryController } from './presentation/global-history.controller'
import { ChronicleArchiveController } from './presentation/chronicle-archive.controller'

@Module({
  controllers: [GlobalHistoryController, ChronicleArchiveController],
})
export class HistoryModule {}
