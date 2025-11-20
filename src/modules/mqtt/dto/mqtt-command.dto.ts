/**
 * MQTT Command types that can be sent to drones
 */
export enum MqttCommandType {
  ROUTE_CHANGE = 'route_change',
  RETURN_TO_BASE = 'return_to_base',
  EMERGENCY_LAND = 'emergency_land',
  SPEED_LIMIT = 'speed_limit',
  STATUS_REQUEST = 'status_request',
}

/**
 * Base MQTT Command structure
 */
export interface MqttCommandDto {
  commandId: string; // UUID for command tracking
  type: MqttCommandType;
  timestamp: number;
  payload: any; // Type depends on command type
}

/**
 * Route change command payload
 */
export interface RouteChangePayload {
  orderId: string;
  newDestination: {
    lat: number;
    lon: number;
    address?: string;
  };
  reason: string;
}

/**
 * Return to base command payload
 */
export interface ReturnToBasePayload {
  baseLocation: {
    lat: number;
    lon: number;
  };
  urgent: boolean;
}

/**
 * Emergency land command payload
 */
export interface EmergencyLandPayload {
  reason: string;
}

/**
 * Speed limit command payload
 */
export interface SpeedLimitPayload {
  maxSpeed: number; // km/h
  reason: string;
}

/**
 * Command acknowledgment from drone
 */
export interface MqttCommandAckDto {
  commandId: string;
  received: boolean;
  executed: boolean;
  error?: string;
  timestamp: number;
}
