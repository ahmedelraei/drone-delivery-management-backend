/**
 * MQTT Heartbeat payload DTO
 * Sent by drones every 30 seconds via MQTT
 * More lightweight than REST version
 */
export interface MqttHeartbeatDto {
  droneId: string;
  location: {
    lat: number; // Using short names to reduce MQTT payload size
    lon: number;
    alt?: number;
  };
  battery: number; // 0-100
  speed: number; // km/h
  timestamp: number; // Unix timestamp for clock sync verification
}

/**
 * MQTT Heartbeat acknowledgment
 * Sent back to drone with current job status and instructions
 */
export interface MqttHeartbeatAckDto {
  status: 'ok' | 'warning' | 'error';
  currentJob?: {
    orderId: string;
    destLat: number;
    destLon: number;
    eta: number; // Unix timestamp
  };
  instructions?: string;
  serverTime: number; // Unix timestamp for clock sync
}
