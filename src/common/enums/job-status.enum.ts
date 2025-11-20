/**
 * Job status enumeration
 * Tracks the lifecycle of a job assignment
 */
export enum JobStatus {
  PENDING = 'pending', // Job created, waiting for drone to reserve it
  ASSIGNED = 'assigned', // Drone has reserved the job
  COMPLETED = 'completed', // Job successfully completed
  CANCELLED = 'cancelled', // Job cancelled before completion
}
