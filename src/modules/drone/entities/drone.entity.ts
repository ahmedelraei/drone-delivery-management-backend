import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Relation,
} from 'typeorm';
import { DroneStatus } from '../../../common/enums/index';
import { Location } from '../../../common/entities/location.entity';
import type { Order } from '../../order/entities/order.entity';

/**
 * Drone entity
 * Represents a delivery drone with its capabilities, status, and operational data
 * Tracks location, battery, performance metrics, and maintenance history
 */
@Entity('drones')
export class Drone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Drone model identifier (e.g., "DX-200", "HeavyLifter-Pro")
  @Column({ type: 'varchar', length: 100 })
  model: string;

  // Current operational status
  @Column({
    type: 'enum',
    enum: DroneStatus,
    default: DroneStatus.IDLE,
  })
  status: DroneStatus;

  // Real-time location updated via heartbeat
  @Column(() => Location)
  currentLocation: Location;

  // Home base location where drone returns when not on delivery
  @Column(() => Location)
  homeBase: Location;

  // Current battery level percentage (0-100)
  @Column({ name: 'battery_level', type: 'int', default: 100 })
  batteryLevel: number;

  // Drone capabilities for job matching (e.g., 'standard', 'heavy', 'fragile')
  @Column({ type: 'simple-array' })
  capabilities: string[];

  // Maximum payload capacity in kilograms
  @Column({ name: 'max_payload', type: 'decimal', precision: 6, scale: 2 })
  maxPayload: number;

  // Maximum flight range in kilometers
  @Column({ name: 'max_range', type: 'decimal', precision: 6, scale: 2 })
  maxRange: number;

  // Current speed in km/h (updated via heartbeat)
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  speed: number;

  // The order currently being delivered (null if idle)
  @Column({ name: 'current_order_id', type: 'uuid', nullable: true })
  currentOrderId: string | null;

  @OneToOne('Order', { nullable: true })
  @JoinColumn({ name: 'current_order_id' })
  currentOrder: Relation<Order>;

  // Last heartbeat timestamp - used to detect offline drones
  @Column({ name: 'last_heartbeat', type: 'timestamp', nullable: true })
  lastHeartbeat: Date;

  // Performance metrics
  @Column({ name: 'total_deliveries', type: 'int', default: 0 })
  totalDeliveries: number;

  @Column({ name: 'total_flight_time', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalFlightTime: number; // in hours

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'last_maintenance_at', type: 'timestamp', nullable: true })
  lastMaintenanceAt: Date;

}
