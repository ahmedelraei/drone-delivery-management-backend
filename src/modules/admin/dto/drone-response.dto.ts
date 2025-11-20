import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DroneStatus } from '../../../common/enums/index';
import { Location } from '../../../common/entities/location.entity';

/**
 * DTO for drone response
 */
export class DroneResponseDto {
  @ApiProperty({
    description: 'Drone ID',
    example: 'drone-001',
  })
  id: string;

  @ApiProperty({
    description: 'Drone model',
    example: 'DX-200',
  })
  model: string;

  @ApiProperty({
    description: 'Current operational status',
    enum: DroneStatus,
  })
  status: DroneStatus;

  @ApiProperty({
    description: 'Current location',
    type: Location,
  })
  currentLocation: Location;

  @ApiProperty({
    description: 'Home base location',
    type: Location,
  })
  homeBase: Location;

  @ApiProperty({
    description: 'Battery level (0-100)',
    example: 85,
  })
  batteryLevel: number;

  @ApiProperty({
    description: 'Drone capabilities',
    example: ['standard', 'fragile'],
    isArray: true,
  })
  capabilities: string[];

  @ApiProperty({
    description: 'Maximum payload in kg',
    example: 10.0,
  })
  maxPayload: number;

  @ApiProperty({
    description: 'Maximum range in km',
    example: 50.0,
  })
  maxRange: number;

  @ApiProperty({
    description: 'Current speed in km/h',
    example: 0,
  })
  speed: number;

  @ApiPropertyOptional({
    description: 'Current order ID if drone is on delivery',
    example: 'order-123',
    nullable: true,
  })
  currentOrderId?: string | null;

  @ApiPropertyOptional({
    description: 'Last heartbeat timestamp',
    example: '2025-11-20T10:30:00.000Z',
  })
  lastHeartbeat?: Date;

  @ApiProperty({
    description: 'Total deliveries completed',
    example: 42,
  })
  totalDeliveries: number;

  @ApiProperty({
    description: 'Total flight time in hours',
    example: 125.5,
  })
  totalFlightTime: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Last maintenance timestamp',
    example: '2025-11-15T00:00:00.000Z',
  })
  lastMaintenanceAt?: Date;
}

