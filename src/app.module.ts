import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { OrderModule } from './modules/order/order.module';
import { DroneModule } from './modules/drone/drone.module';
import { AdminModule } from './modules/admin/admin.module';
import { MqttModule } from './modules/mqtt/mqtt.module';
import { HealthModule } from './health/health.module';
import { typeOrmConfig } from './config/typeorm.config';
import { appConfig } from './config/app.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

/**
 * Root application module
 * Orchestrates all feature modules and global configurations
 */
@Module({
  imports: [
    // Load environment variables and configuration
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available throughout the app
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database connection using TypeORM
    TypeOrmModule.forRootAsync({
      useFactory: typeOrmConfig,
    }),

    // Feature modules - each handles a specific business domain
    AuthModule, // JWT authentication and token management
    UserModule, // User management and profiles
    OrderModule, // Order lifecycle and tracking
    DroneModule, // Drone operations and job assignments
    AdminModule, // Administrative functions and monitoring
    MqttModule, // MQTT real-time communication for drones
    HealthModule, // Health check endpoints
  ],
  providers: [
    // Global exception filter for standardized error responses
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global JWT authentication guard (can be overridden per route)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
