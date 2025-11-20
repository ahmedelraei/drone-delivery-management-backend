import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DroneStatus } from '../../../common/enums/index';
import { LocationDto } from '../../../common/dto/location.dto';

/**
 * DTO for heartbeat response
 */
export class HeartbeatResponseDto {
  @ApiProperty({
    description: 'Drone operational status',
    enum: DroneStatus,
    example: DroneStatus.OPERATIONAL,
  })
  status: DroneStatus;

  @ApiPropertyOptional({
    description: 'Current job information',
  })
  currentJob?: {
    orderId: string;
    destination: LocationDto;
    eta: Date;
  };

  @ApiPropertyOptional({
    description: 'Instructions for the drone',
    example: 'Battery low. Return to base after delivery.',
  })
  instructions?: string;
}
