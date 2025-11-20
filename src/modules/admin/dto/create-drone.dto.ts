import { IsString, IsEnum, IsNumber, IsArray, ValidateNested, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DroneStatus } from '../../../common/enums/index';
import { LocationDto } from '../../../common/dto/location.dto';

/**
 * DTO for creating a new drone
 */
export class CreateDroneDto {
  @ApiPropertyOptional({
    description: 'Drone ID (optional - will be auto-generated UUID if not provided)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Drone model identifier',
    example: 'DX-300',
  })
  @IsString()
  model: string;

  @ApiPropertyOptional({
    description: 'Initial drone status',
    enum: DroneStatus,
    default: DroneStatus.IDLE,
  })
  @IsOptional()
  @IsEnum(DroneStatus)
  status?: DroneStatus;

  @ApiProperty({
    description: 'Current location of the drone',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  currentLocation: LocationDto;

  @ApiProperty({
    description: 'Home base location where drone returns when idle',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  homeBase: LocationDto;

  @ApiPropertyOptional({
    description: 'Initial battery level (0-100)',
    example: 100,
    minimum: 0,
    maximum: 100,
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @ApiProperty({
    description: 'Drone capabilities for job matching',
    example: ['standard', 'fragile', 'heavy'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  capabilities: string[];

  @ApiProperty({
    description: 'Maximum payload capacity in kilograms',
    example: 12.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  maxPayload: number;

  @ApiProperty({
    description: 'Maximum flight range in kilometers',
    example: 55.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  maxRange: number;
}

