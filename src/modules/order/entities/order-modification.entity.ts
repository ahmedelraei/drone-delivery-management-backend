import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Location } from '../../../common/entities/location.entity';

/**
 * OrderModification entity
 * Audit trail for administrative changes to orders
 * Tracks what was changed, when, by whom, and why
 */
@Entity('order_modifications')
export class OrderModification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The order that was modified
  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.modificationHistory)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Admin who made the modification
  @Column({ name: 'modified_by', type: 'varchar', length: 255 })
  modifiedBy: string;

  // Reason for the modification (required for audit)
  @Column({ type: 'text' })
  reason: string;

  // Previous values (stored as JSON for flexibility)
  @Column({ name: 'previous_origin', type: 'jsonb', nullable: true })
  previousOrigin: Location;

  @Column({ name: 'previous_destination', type: 'jsonb', nullable: true })
  previousDestination: Location;

  // New values after modification
  @Column({ name: 'new_origin', type: 'jsonb', nullable: true })
  newOrigin: Location;

  @Column({ name: 'new_destination', type: 'jsonb', nullable: true })
  newDestination: Location;

  // When the modification occurred
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
