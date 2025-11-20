import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../../common/enums/index';

/**
 * DTO for order cancellation response
 */
export class CancelOrderResponseDto {
  @ApiProperty({
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orderId: string;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.CANCELLED,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Refund amount',
    example: 15.99,
  })
  refundAmount: number;

  @ApiProperty({
    description: 'Cancellation timestamp',
    example: '2025-11-19T15:30:00.000Z',
  })
  cancelledAt: Date;
}
