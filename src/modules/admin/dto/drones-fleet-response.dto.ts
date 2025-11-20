import { ApiProperty } from '@nestjs/swagger';
import { DroneStatus } from '../../../common/enums/index';

/**
 * DTO for fleet status response
 */
export class DronesFleetResponseDto {
  @ApiProperty({
    description: 'Array of drones',
    type: 'array',
  })
  drones: Array<{
    droneId: string;
    model: string;
    status: DroneStatus;
    currentLocation: any;
    batteryLevel: number;
    currentOrder: string | null;
    lastHeartbeat: Date;
    totalDeliveries: number;
    totalFlightTime: number;
  }>;

  @ApiProperty({
    description: 'Total number of drones',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Fleet summary statistics',
  })
  summary: {
    operational: number;
    broken: number;
    inTransit: number;
    idle: number;
  };
}
