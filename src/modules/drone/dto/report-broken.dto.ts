import { IsString, IsEnum, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { LocationDto } from '../../../common/dto/location.dto';
import { Severity } from '../../../common/enums/index';

/**
 * DTO for drone reporting broken status
 */
export class ReportBrokenDto {
  @ApiProperty({
    description: 'Drone ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  droneId: string;

  @ApiProperty({
    description: 'Current location of drone',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    description: 'Issue description',
    example: 'Motor malfunction detected',
  })
  @IsString()
  @IsNotEmpty()
  issue: string;

  @ApiProperty({
    description: 'Issue severity',
    enum: Severity,
    example: Severity.HIGH,
  })
  @IsEnum(Severity)
  severity: Severity;
}
