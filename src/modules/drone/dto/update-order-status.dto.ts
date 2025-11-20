import { IsString, IsEnum, IsNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationDto } from '../../../common/dto/location.dto';
import { OrderStatus } from '../../../common/enums/index';

/**
 * DTO for updating order delivery status
 */
export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Drone ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  droneId: string;

  @ApiProperty({
    description: 'Order status',
    enum: [OrderStatus.DELIVERED, OrderStatus.FAILED],
    example: OrderStatus.DELIVERED,
  })
  @IsEnum([OrderStatus.DELIVERED, OrderStatus.FAILED])
  status: OrderStatus.DELIVERED | OrderStatus.FAILED;

  @ApiProperty({
    description: 'Current location of drone',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Delivered to reception',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Failure reason (required if status is failed)',
    example: 'Customer not available',
  })
  @IsString()
  @IsOptional()
  failureReason?: string;
}
