import { Module } from '@nestjs/common'
import { DashboardContextController } from './dashboard-context.controller'
@Module({ controllers: [DashboardContextController] })
export class DashboardModule {}
