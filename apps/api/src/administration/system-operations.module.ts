import { Module } from '@nestjs/common'

import {
  SystemOperationsController,
} from './system-operations.controller'

@Module({
  controllers: [
    SystemOperationsController,
  ],
})
export class SystemOperationsModule {}
