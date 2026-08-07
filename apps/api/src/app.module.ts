import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
import { CharactersModule } from './characters/characters.module'
import { ChroniclesModule } from './chronicles/chronicles.module'
import { UsersModule } from './users/users.module'
import { DatabaseModule } from './database/database.module'
import { HealthModule } from './health/health.module'

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CharactersModule,
    ChroniclesModule,
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}
