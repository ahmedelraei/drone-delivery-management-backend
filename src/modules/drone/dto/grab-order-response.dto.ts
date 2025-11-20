import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../../common/enums/index';
import { LocationDto } from '../../../common/dto/location.dto';

/**
 * DTO for grab order response
 */
export class GrabOrderResponseDto {
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
    description: 'Destination location',
    type: LocationDto,
  })
  destination: LocationDto;

  @ApiProperty({
    description: 'Estimated delivery time',
    example: '2025-11-19T16:15:00.000Z',
  })
  estimatedDeliveryTime: Date;
}
