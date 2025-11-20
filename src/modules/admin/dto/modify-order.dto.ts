import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationDto } from '../../../common/dto/location.dto';

/**
 * DTO for modifying order route
 */
export class ModifyOrderDto {
  @ApiPropertyOptional({
    description: 'New origin location',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  origin?: LocationDto;

  @ApiPropertyOptional({
    description: 'New destination location',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  destination?: LocationDto;

  @ApiProperty({
    description: 'Reason for modification',
    example: 'Customer requested address change',
  })
  @IsString()
  reason: string;
}
