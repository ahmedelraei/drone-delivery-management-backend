/**
 * Application configuration
 * Centralizes all app-wide settings and environment variables
 */
export const appConfig = () => ({
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'drone_delivery',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    accessTokenExpiration: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRATION || '900', 10), // 15 minutes
    refreshTokenExpiration: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION || '604800', 10), // 7 days
  },

  // Rate limiting
  rateLimit: {
    general: parseInt(process.env.RATE_LIMIT_GENERAL || '100', 10),
    auth: parseInt(process.env.RATE_LIMIT_AUTH || '5', 10),
  },

  // Business rules configuration
  service: {
    areaRadiusKm: parseInt(process.env.SERVICE_AREA_RADIUS_KM || '50', 10),
    droneHeartbeatTimeoutSeconds: parseInt(
      process.env.DRONE_HEARTBEAT_TIMEOUT_SECONDS || '120',
      10,
    ),
    droneOfflineTimeoutSeconds: parseInt(process.env.DRONE_OFFLINE_TIMEOUT_SECONDS || '300', 10),
    locationToleranceMeters: parseInt(process.env.LOCATION_TOLERANCE_METERS || '50', 10),
    lowBatteryThreshold: parseInt(process.env.LOW_BATTERY_THRESHOLD || '20', 10),
  },

  // MQTT configuration
  mqtt: {
    brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: process.env.MQTT_CLIENT_ID || 'drone-delivery-backend',
    reconnectPeriod: parseInt(process.env.MQTT_RECONNECT_PERIOD || '5000', 10),
    connectTimeout: parseInt(process.env.MQTT_CONNECT_TIMEOUT || '30000', 10),
    keepAlive: parseInt(process.env.MQTT_KEEP_ALIVE || '60', 10),
  },
});

export type AppConfig = ReturnType<typeof appConfig>;
