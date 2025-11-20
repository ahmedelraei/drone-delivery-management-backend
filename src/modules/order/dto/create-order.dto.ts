import { Type } from 'class-transformer';
import { IsOptional, ValidateNested, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationDto } from '../../../common/dto/location.dto';
import { PackageDetailsDto } from './package-details.dto';

/**
 * DTO for creating a new order
 * Used by end users to submit delivery requests
 */
export class CreateOrderDto {
  @ApiProperty({
    description: 'Pickup location',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ApiProperty({
    description: 'Delivery destination',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @ApiProperty({
    description: 'Package details',
    type: PackageDetailsDto,
  })
  @ValidateNested()
  @Type(() => PackageDetailsDto)
  packageDetails: PackageDetailsDto;

  @ApiPropertyOptional({
    description: 'Scheduled pickup time (ISO 8601 format)',
    example: '2025-11-19T15:30:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledPickupTime?: string;
}
