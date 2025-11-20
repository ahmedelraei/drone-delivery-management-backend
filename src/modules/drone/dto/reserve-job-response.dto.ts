import { ApiProperty } from '@nestjs/swagger';
import { JobType } from '../../../common/enums/index';
import { LocationDto } from '../../../common/dto/location.dto';

/**
 * DTO for job reservation response
 */
export class ReserveJobResponseDto {
  @ApiProperty({
    description: 'Job ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  jobId: string;

  @ApiProperty({
    description: 'Order ID associated with this job',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  orderId: string;

  @ApiProperty({
    description: 'Pickup location',
    type: LocationDto,
  })
  pickupLocation: LocationDto;

  @ApiProperty({
    description: 'Job type (delivery or rescue)',
    enum: JobType,
    example: JobType.DELIVERY,
  })
  type: JobType;
}
