import { Module } from '@nestjs/common'
import { CharactersModule } from './characters/characters.module'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './health/health.module'

@Module({
  imports: [
    DatabaseModule,
    CharactersModule,
    HealthModule,
  ],
})
export class AppModule {}
