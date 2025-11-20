/**
 * Order status enumeration
 * Tracks the lifecycle of a delivery order from creation to completion
 */
export enum OrderStatus {
  PENDING = 'pending', // Order created, waiting for drone assignment
  ASSIGNED = 'assigned', // Drone assigned, heading to pickup location
  PICKED_UP = 'picked_up', // Drone has picked up the package
  IN_TRANSIT = 'in_transit', // Drone is en route to destination
  AWAITING_RESCUE = 'awaiting_rescue', // Assigned drone broke down, needs rescue
  DELIVERED = 'delivered', // Successfully delivered to destination
  FAILED = 'failed', // Delivery failed for some reason
  CANCELLED = 'cancelled', // Order cancelled by user or admin
}
