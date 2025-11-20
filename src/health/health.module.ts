import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * Health check module
 * Provides endpoints for monitoring and health checks
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
