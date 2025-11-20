/**
 * Job type enumeration
 * Defines the type of job a drone can be assigned to
 */
export enum JobType {
  DELIVERY = 'delivery', // Standard package delivery
  RESCUE = 'rescue', // Pick up package from broken drone
}
