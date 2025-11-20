import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../../common/enums/index';
import { LocationDto } from '../../../common/dto/location.dto';

/**
 * DTO for order modification response
 */
export class ModifyOrderResponseDto {
  @ApiProperty({
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orderId: string;

  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Updated origin',
    type: LocationDto,
  })
  origin: LocationDto;

  @ApiProperty({
    description: 'Updated destination',
    type: LocationDto,
  })
  destination: LocationDto;

  @ApiProperty({
    description: 'New estimated delivery time',
    example: '2025-11-19T16:30:00.000Z',
  })
  newEta: Date;

  @ApiProperty({
    description: 'Modification timestamp',
    example: '2025-11-19T15:00:00.000Z',
  })
  modifiedAt: Date;

  @ApiProperty({
    description: 'Admin who modified the order',
    example: 'admin_john',
  })
  modifiedBy: string;
}
