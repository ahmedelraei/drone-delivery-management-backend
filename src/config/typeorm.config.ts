import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * TypeORM configuration for PostgreSQL database
 * Handles connection settings, entity discovery, and migrations
 */
export const typeOrmConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'drone_delivery',
  // Use autoLoadEntities to automatically load entities registered via TypeOrmModule.forFeature()
  // This avoids the need to specify file paths and prevents require() issues with ES modules
  autoLoadEntities: true,
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development', // Only auto-sync in development
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

  // Connection pool settings for high concurrency
  extra: {
    max: 20, // Maximum number of connections in pool
    min: 5, // Minimum number of connections
    idleTimeoutMillis: 30000,
  },
});

// DataSource for TypeORM CLI (migrations)
const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'drone_delivery',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
};

export const AppDataSource = new DataSource(dataSourceOptions);
