/**
 * MQTT Location update for order tracking
 * Published by server for real-time order tracking
 */
export interface MqttLocationDto {
  orderId: string;
  droneId: string;
  location: {
    lat: number;
    lon: number;
    alt?: number;
  };
  speed: number;
  eta: number; // Unix timestamp
  timestamp: number;
}
