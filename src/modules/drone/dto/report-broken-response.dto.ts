import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DroneStatus } from '../../../common/enums/index';

/**
 * DTO for broken status report response
 */
export class ReportBrokenResponseDto {
  @ApiProperty({
    description: 'Drone ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  droneId: string;

  @ApiProperty({
    description: 'Drone status',
    enum: DroneStatus,
    example: DroneStatus.BROKEN,
  })
  status: DroneStatus;

  @ApiPropertyOptional({
    description: 'Rescue job ID (if drone was carrying order)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  rescueJobId?: string;

  @ApiProperty({
    description: 'Response message',
    example: 'Drone marked as broken. Rescue job created.',
  })
  message: string;
}
