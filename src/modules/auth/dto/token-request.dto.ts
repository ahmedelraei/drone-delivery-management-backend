import { IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../../common/enums/index';

/**
 * DTO for token generation request
 * Used for initial authentication based on name and user type
 */
export class TokenRequestDto {
  @ApiProperty({
    description: 'User name for authentication',
    example: 'john_doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Type of user',
    enum: UserType,
    example: UserType.ENDUSER,
  })
  @IsEnum(UserType)
  type: UserType;
}
