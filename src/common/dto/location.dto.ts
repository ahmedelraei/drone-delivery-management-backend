import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Location DTO
 * Used for geographic coordinates throughout the system
 */
export class LocationDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 37.7749,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -122.4194,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'Altitude in meters',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  altitude?: number | null;

  @ApiPropertyOptional({
    description: 'Human-readable address',
    example: '123 Main St, San Francisco, CA 94102',
  })
  @IsString()
  @IsOptional()
  address?: string | null;

  @ApiPropertyOptional({
    description: 'Timestamp when this location was recorded',
    example: '2025-01-15T10:30:00.000Z',
  })
  @IsOptional()
  timestamp?: Date | null;
}
