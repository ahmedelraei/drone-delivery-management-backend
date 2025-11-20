import { Column } from 'typeorm';

/**
 * Location embeddable entity
 * Represents a geographic coordinate with optional address
 * Used throughout the system for pickup/delivery locations and drone positions
 */
export class Location {
  // Geographic coordinates using WGS84 datum
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  // Altitude in meters (important for drone flight)
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  altitude: number | null;

  // Human-readable address for customer reference
  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  // Timestamp when this location was recorded (useful for tracking)
  @Column({ type: 'timestamp', nullable: true })
  timestamp: Date | null;
}
