import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

interface HealthResponse {
  status: 'ok'
  service: 'api'
  database: 'ok'
  application: 'Vampiro V5 Revolution'
  timestamp: string
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly database: DatabaseService,
  ) {}

  @Get()
  async check(): Promise<HealthResponse> {
    const databaseHealthy = await this.database.isHealthy()

    if (!databaseHealthy) {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'api',
        database: 'unavailable',
      })
    }

    return {
      status: 'ok',
      service: 'api',
      database: 'ok',
      application: 'Vampiro V5 Revolution',
      timestamp: new Date().toISOString(),
    }
  }
}
