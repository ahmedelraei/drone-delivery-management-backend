import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../../../common/enums/index';
import { LocationDto } from '../../../common/dto/location.dto';
import { PackageDetailsDto } from './package-details.dto';

/**
 * DTO for order response
 * Used when returning order information to clients
 */
export class OrderResponseDto {
  @ApiProperty({
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orderId: string;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Pickup location',
    type: LocationDto,
  })
  origin: LocationDto;

  @ApiProperty({
    description: 'Delivery destination',
    type: LocationDto,
  })
  destination: LocationDto;

  @ApiPropertyOptional({
    description: 'Current location of drone (if in transit)',
    type: LocationDto,
  })
  currentLocation?: LocationDto;

  @ApiPropertyOptional({
    description: 'Assigned drone information',
  })
  assignedDrone?: {
    droneId: string;
    model: string;
  };

  @ApiProperty({
    description: 'Package details',
    type: PackageDetailsDto,
  })
  packageDetails: PackageDetailsDto;

  @ApiProperty({
    description: 'Estimated pickup time',
    example: '2025-11-19T15:30:00.000Z',
  })
  estimatedPickupTime: Date;

  @ApiProperty({
    description: 'Estimated delivery time',
    example: '2025-11-19T16:15:00.000Z',
  })
  estimatedDeliveryTime: Date;

  @ApiProperty({
    description: 'Delivery cost',
    example: 15.99,
  })
  cost: number;

  @ApiPropertyOptional({
    description: 'Order timeline with status changes',
  })
  timeline?: Array<{
    status: string;
    timestamp: Date;
    location?: LocationDto;
  }>;
}
