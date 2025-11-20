import { IsNumber, IsBoolean, IsString, IsOptional, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Package details DTO
 * Contains information about the package being delivered
 */
export class PackageDetailsDto {
  @ApiProperty({
    description: 'Package weight in kilograms',
    example: 2.5,
    minimum: 0.1,
  })
  @IsNumber()
  @Min(0.1)
  weight: number;

  @ApiProperty({
    description: 'Package length in centimeters',
    example: 30,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  length: number;

  @ApiProperty({
    description: 'Package width in centimeters',
    example: 20,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  width: number;

  @ApiProperty({
    description: 'Package height in centimeters',
    example: 15,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  height: number;

  @ApiProperty({
    description: 'Whether package is fragile',
    example: false,
  })
  @IsBoolean()
  fragile: boolean;

  @ApiPropertyOptional({
    description: 'Package description',
    example: 'Electronics - handle with care',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Special handling requirements',
    example: ['temperature-sensitive', 'upright-only'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialHandling?: string[];
}
