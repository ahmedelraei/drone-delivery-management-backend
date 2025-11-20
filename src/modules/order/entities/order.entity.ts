import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { OrderStatus } from '../../../common/enums/index';
import { Location } from '../../../common/entities/location.entity';
import { PackageDetails } from './package-details.entity';
import { User } from '../../user/entities/user.entity';
import { Drone } from '../../drone/entities/drone.entity';
import { OrderModification } from './order-modification.entity';

/**
 * Order entity
 * Central entity representing a delivery request from pickup to delivery
 * Tracks the complete lifecycle including assignments, locations, and history
 */
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The end user who placed the order
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Current order status in the delivery lifecycle
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  // Origin location (where to pick up the package)
  @Column(() => Location)
  origin: Location;

  // Destination location (where to deliver the package)
  @Column(() => Location)
  destination: Location;

  // Package information for proper handling
  @Column(() => PackageDetails)
  packageDetails: PackageDetails;

  // The drone currently assigned to this order (null if unassigned)
  @Column({ name: 'assigned_drone_id', type: 'uuid', nullable: true })
  assignedDroneId: string;

  @ManyToOne(() => Drone, (drone) => drone.orders, { nullable: true })
  @JoinColumn({ name: 'assigned_drone_id' })
  assignedDrone: Drone;

  // Calculated delivery cost based on distance and weight
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  cost: number;

  // Estimated times calculated at order creation
  @Column({ name: 'estimated_pickup_time', type: 'timestamp' })
  estimatedPickupTime: Date;

  @Column({ name: 'estimated_delivery_time', type: 'timestamp' })
  estimatedDeliveryTime: Date;

  // Actual times recorded during delivery (null until event occurs)
  @Column({ name: 'actual_pickup_time', type: 'timestamp', nullable: true })
  actualPickupTime: Date;

  @Column({ name: 'actual_delivery_time', type: 'timestamp', nullable: true })
  actualDeliveryTime: Date;

  // Timestamps for tracking order lifecycle
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  // Reason for failure if delivery didn't complete successfully
  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason: string;

  // Optional scheduled pickup time for future deliveries
  @Column({ name: 'scheduled_pickup_time', type: 'timestamp', nullable: true })
  scheduledPickupTime: Date;

  // History of admin modifications to this order
  @OneToMany(() => OrderModification, (modification) => modification.order)
  modificationHistory: OrderModification[];
}
