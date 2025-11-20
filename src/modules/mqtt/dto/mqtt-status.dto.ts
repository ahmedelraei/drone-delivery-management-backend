import { DroneStatus } from '../../../common/enums/index';

/**
 * MQTT Status change payload
 * Published when drone status changes
 */
export interface MqttStatusDto {
  droneId: string;
  status: DroneStatus;
  reason?: string;
  timestamp: number;
  location?: {
    lat: number;
    lon: number;
    alt?: number;
  };
}

/**
 * MQTT Status acknowledgment
 */
export interface MqttStatusAckDto {
  received: boolean;
  message?: string;
  timestamp: number;
}
