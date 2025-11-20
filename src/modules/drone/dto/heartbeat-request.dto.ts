import { IsString, IsNumber, IsNotEmpty, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocationDto } from '../../../common/dto/location.dto';

/**
 * DTO for drone heartbeat
 */
export class HeartbeatRequestDto {
  @ApiProperty({
    description: 'Drone ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  droneId: string;

  @ApiProperty({
    description: 'Current location',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    description: 'Battery level (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  batteryLevel: number;

  @ApiProperty({
    description: 'Current speed in km/h',
    example: 45,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  speed: number;
}
