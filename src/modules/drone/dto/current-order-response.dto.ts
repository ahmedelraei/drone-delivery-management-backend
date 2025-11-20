import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../../common/enums/index';
import { LocationDto } from '../../../common/dto/location.dto';
import { PackageDetailsDto } from '../../order/dto/package-details.dto';

/**
 * DTO for current order details response
 */
export class CurrentOrderResponseDto {
  @ApiProperty({
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orderId: string;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.IN_TRANSIT,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Origin location',
    type: LocationDto,
  })
  origin: LocationDto;

  @ApiProperty({
    description: 'Destination location',
    type: LocationDto,
  })
  destination: LocationDto;

  @ApiProperty({
    description: 'Package details',
    type: PackageDetailsDto,
  })
  packageDetails: PackageDetailsDto;

  @ApiProperty({
    description: 'Estimated delivery time',
    example: '2025-11-19T16:15:00.000Z',
  })
  estimatedDeliveryTime: Date;
}
