import { Module } from '@nestjs/common'

import { GlobalHistoryController } from './presentation/global-history.controller'

@Module({
  controllers: [GlobalHistoryController],
})
export class HistoryModule {}
