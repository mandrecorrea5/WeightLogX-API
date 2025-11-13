import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database health check
      () => this.db.pingCheck('database', { timeout: 3000 }),

      // Memory health check (warn if above 80% of 1GB)
      () => this.memory.checkHeap('memory_heap', 1024 * 1024 * 1024 * 0.8),

      // RSS memory check (warn if above 80% of 1GB)
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024 * 0.8),

      // Disk health check (warn if above 80% of 100GB)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.8,
        }),
    ]);
  }

  @Get('liveness')
  @Public()
  @HealthCheck()
  liveness() {
    // Simple liveness check - just verify the app is running
    return this.health.check([]);
  }

  @Get('readiness')
  @Public()
  @HealthCheck()
  readiness() {
    // Readiness check - verify critical dependencies
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
    ]);
  }
}
