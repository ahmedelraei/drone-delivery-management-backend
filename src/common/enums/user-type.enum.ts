/**
 * User type enumeration
 * Defines the three types of actors in the system
 */
export enum UserType {
  ADMIN = 'admin', // System administrators with full access
  ENDUSER = 'enduser', // Customers who place orders
  DRONE = 'drone', // Autonomous delivery drones
}
