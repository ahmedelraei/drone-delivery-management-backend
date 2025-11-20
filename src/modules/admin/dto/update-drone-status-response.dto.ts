import { ApiProperty } from '@nestjs/swagger';
import { DroneStatus } from '../../../common/enums/index';

/**
 * DTO for drone status update response
 */
export class UpdateDroneStatusResponseDto {
  @ApiProperty({
    description: 'Drone ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  droneId: string;

  @ApiProperty({
    description: 'Previous status',
    enum: DroneStatus,
  })
  previousStatus: DroneStatus;

  @ApiProperty({
    description: 'New status',
    enum: DroneStatus,
  })
  newStatus: DroneStatus;

  @ApiProperty({
    description: 'Update timestamp',
    example: '2025-11-19T15:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Admin who updated the status',
    example: 'admin_john',
  })
  updatedBy: string;
}
