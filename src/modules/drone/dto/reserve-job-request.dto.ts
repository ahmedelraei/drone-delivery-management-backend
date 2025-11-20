import { IsString, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for drone job reservation request
 */
export class ReserveJobRequestDto {
  @ApiProperty({
    description: 'Drone ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  droneId: string;

  @ApiProperty({
    description: 'Drone capabilities for job matching',
    example: ['standard', 'heavy', 'fragile'],
  })
  @IsArray()
  @IsString({ each: true })
  capabilities: string[];
}
