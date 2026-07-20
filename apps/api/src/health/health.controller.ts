import { Controller, Get } from '@nestjs/common'

interface HealthResponse {
  status: 'ok'
  service: 'api'
  application: 'Vampiro V5 Revolution'
  timestamp: string
}

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'api',
      application: 'Vampiro V5 Revolution',
      timestamp: new Date().toISOString(),
    }
  }
}
