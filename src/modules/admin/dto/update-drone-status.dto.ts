import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DroneStatus } from '../../../common/enums/index';

/**
 * DTO for updating drone status
 */
export class UpdateDroneStatusDto {
  @ApiProperty({
    description: 'New drone status',
    enum: [DroneStatus.OPERATIONAL, DroneStatus.BROKEN],
    example: DroneStatus.OPERATIONAL,
  })
  @IsEnum([DroneStatus.OPERATIONAL, DroneStatus.BROKEN])
  status: DroneStatus.OPERATIONAL | DroneStatus.BROKEN;

  @ApiProperty({
    description: 'Reason for status change',
    example: 'Maintenance completed',
  })
  @IsString()
  reason: string;
}
