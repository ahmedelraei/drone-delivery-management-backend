/**
 * MQTT topic structure for the drone delivery system
 *
 * Topic Hierarchy:
 * - drones/{droneId}/heartbeat - Drone publishes location and status
 * - drones/{droneId}/commands - Server publishes commands to specific drone
 * - drones/{droneId}/status - Drone publishes status changes
 * - orders/{orderId}/location - Real-time location updates for order tracking
 * - system/drones/connected - Drone connection notifications
 * - system/drones/disconnected - Drone disconnection notifications
 */

export class MqttTopics {
  // Base topics
  private static readonly DRONES_BASE = 'drones';
  private static readonly ORDERS_BASE = 'orders';
  private static readonly SYSTEM_BASE = 'system';

  /**
   * Get heartbeat topic for a specific drone
   * Drone publishes: location, battery, speed, altitude
   * Frequency: Every 30 seconds
   */
  static droneHeartbeat(droneId: string): string {
    return `${this.DRONES_BASE}/${droneId}/heartbeat`;
  }

  /**
   * Get commands topic for a specific drone
   * Server publishes: route changes, emergency commands, job assignments
   */
  static droneCommands(droneId: string): string {
    return `${this.DRONES_BASE}/${droneId}/commands`;
  }

  /**
   * Get status topic for a specific drone
   * Drone publishes: operational, broken, idle, in_transit
   */
  static droneStatus(droneId: string): string {
    return `${this.DRONES_BASE}/${droneId}/status`;
  }

  /**
   * Get location topic for order tracking
   * Server publishes: current drone location for orders in transit
   */
  static orderLocation(orderId: string): string {
    return `${this.ORDERS_BASE}/${orderId}/location`;
  }

  /**
   * Wildcard subscription for all drone heartbeats
   * Used by server to monitor all drones
   */
  static allDronesHeartbeat(): string {
    return `${this.DRONES_BASE}/+/heartbeat`;
  }

  /**
   * Wildcard subscription for all drone status updates
   */
  static allDronesStatus(): string {
    return `${this.DRONES_BASE}/+/status`;
  }

  /**
   * System-wide drone connection topic
   */
  static droneConnected(): string {
    return `${this.SYSTEM_BASE}/drones/connected`;
  }

  /**
   * System-wide drone disconnection topic
   */
  static droneDisconnected(): string {
    return `${this.SYSTEM_BASE}/drones/disconnected`;
  }

  /**
   * Extract drone ID from a topic path
   */
  static extractDroneId(topic: string): string | null {
    const match = topic.match(/^drones\/([^/]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Extract order ID from a topic path
   */
  static extractOrderId(topic: string): string | null {
    const match = topic.match(/^orders\/([^/]+)\//);
    return match ? match[1] : null;
  }
}
