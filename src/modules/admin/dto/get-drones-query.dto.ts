import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DroneStatus } from '../../../common/enums/index';

/**
 * DTO for querying drones with filters
 */
export class GetDronesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by drone status',
    enum: DroneStatus,
  })
  @IsEnum(DroneStatus)
  @IsOptional()
  status?: DroneStatus;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    default: 50,
    minimum: 1,
    maximum: 200,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  @IsOptional()
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Number of results to skip',
    default: 0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  offset?: number = 0;
}
