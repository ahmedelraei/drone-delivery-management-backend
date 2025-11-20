import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { JobType, JobStatus, Priority } from '../../../common/enums/index';
import { Location } from '../../../common/entities/location.entity';
import { Order } from '../../order/entities/order.entity';
import { Drone } from './drone.entity';

/**
 * Job entity
 * Represents a task that can be assigned to a drone
 * Can be a regular delivery or a rescue operation for a broken drone
 */
@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Type of job (delivery or rescue)
  @Column({
    type: 'enum',
    enum: JobType,
  })
  type: JobType;

  // The order associated with this job
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // If this is a rescue job, reference to the broken drone
  @Column({ name: 'broken_drone_id', type: 'uuid', nullable: true })
  brokenDroneId: string;

  @ManyToOne(() => Drone, { nullable: true })
  @JoinColumn({ name: 'broken_drone_id' })
  brokenDrone: Drone;

  // Where to pick up the package (origin for delivery, broken drone location for rescue)
  @Column(() => Location)
  pickupLocation: Location;

  // Job priority (rescue jobs get HIGH priority)
  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  // Current status of the job
  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  // Drone assigned to complete this job (null if unassigned)
  @Column({ name: 'assigned_drone_id', type: 'uuid', nullable: true })
  assignedDroneId: string;

  @ManyToOne(() => Drone, { nullable: true })
  @JoinColumn({ name: 'assigned_drone_id' })
  assignedDrone: Drone;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;
}
