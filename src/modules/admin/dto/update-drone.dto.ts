import { IsString, IsEnum, IsNumber, IsArray, ValidateNested, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DroneStatus } from '../../../common/enums/index';
import { LocationDto } from '../../../common/dto/location.dto';

/**
 * DTO for updating an existing drone
 * All fields are optional - only provided fields will be updated
 */
export class UpdateDroneDto {
  @ApiPropertyOptional({
    description: 'Drone model identifier',
    example: 'DX-300-Updated',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Drone operational status',
    enum: DroneStatus,
  })
  @IsOptional()
  @IsEnum(DroneStatus)
  status?: DroneStatus;

  @ApiPropertyOptional({
    description: 'Current location of the drone',
    type: LocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  currentLocation?: LocationDto;

  @ApiPropertyOptional({
    description: 'Home base location',
    type: LocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  homeBase?: LocationDto;

  @ApiPropertyOptional({
    description: 'Battery level (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  batteryLevel?: number;

  @ApiPropertyOptional({
    description: 'Drone capabilities',
    example: ['standard', 'fragile', 'heavy', 'express'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @ApiPropertyOptional({
    description: 'Maximum payload capacity in kilograms',
    example: 15.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPayload?: number;

  @ApiPropertyOptional({
    description: 'Maximum flight range in kilometers',
    example: 60.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxRange?: number;
}

