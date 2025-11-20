/**
 * Drone status enumeration
 * Represents the current operational state of a drone
 */
export enum DroneStatus {
  OPERATIONAL = 'operational', // Drone is working normally and available
  BROKEN = 'broken', // Drone has reported a fault and needs repair
  IN_TRANSIT = 'in_transit', // Drone is currently delivering an order
  IDLE = 'idle', // Drone is ready and waiting for assignment
  OFFLINE = 'offline', // Drone hasn't sent heartbeat within timeout period
}
