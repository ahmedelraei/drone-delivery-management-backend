import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Drone } from './drone.entity';
import { Severity } from '../../../common/enums/index';
import { Location } from '../../../common/entities/location.entity';

/**
 * BreakageEvent entity
 * Records each time a drone reports a failure or issue
 * Useful for maintenance patterns and reliability analysis
 */
@Entity('breakage_events')
export class BreakageEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The drone that reported the issue
  @Column({ name: 'drone_id', type: 'uuid' })
  droneId: string;

  @ManyToOne(() => Drone, (drone) => drone.breakageHistory)
  @JoinColumn({ name: 'drone_id' })
  drone: Drone;

  // Location where the breakage occurred
  @Column(() => Location)
  location: Location;

  // Description of the issue from the drone
  @Column({ type: 'text' })
  issue: string;

  // Severity level of the issue
  @Column({
    type: 'enum',
    enum: Severity,
  })
  severity: Severity;

  // Whether the drone was carrying an order when it broke
  @Column({ name: 'was_carrying_order', type: 'boolean', default: false })
  wasCarryingOrder: boolean;

  // ID of the order being carried (if applicable)
  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  // When the breakage was reported
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // When the drone was fixed (null if still broken)
  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  // Admin notes about the fix
  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string;
}
