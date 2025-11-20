import { Column } from 'typeorm';

/**
 * PackageDetails embeddable entity
 * Contains information about the package being delivered
 * Used to match appropriate drones (weight/size capacity) and handle fragile items
 */
export class PackageDetails {
  // Weight in kilograms
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  weight: number;

  // Dimensions in centimeters
  @Column({ type: 'decimal', precision: 6, scale: 2 })
  length: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  width: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  height: number;

  // Special handling flags
  @Column({ type: 'boolean', default: false })
  fragile: boolean;

  // Package description for drone operators
  @Column({ type: 'text', nullable: true })
  description: string;

  // Array of special handling requirements (e.g., 'temperature-sensitive', 'upright-only')
  @Column({ type: 'simple-array', nullable: true })
  specialHandling: string[];
}
