import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../../common/enums/index';

/**
 * DTO for bulk orders response
 */
export class OrdersBulkResponseDto {
  @ApiProperty({
    description: 'Array of orders',
    type: 'array',
  })
  orders: Array<{
    orderId: string;
    userId: string;
    status: OrderStatus;
    origin: any;
    destination: any;
    assignedDrone: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;

  @ApiProperty({
    description: 'Total number of orders matching filters',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Number of results per page',
    example: 50,
  })
  limit: number;

  @ApiProperty({
    description: 'Number of results skipped',
    example: 0,
  })
  offset: number;
}
