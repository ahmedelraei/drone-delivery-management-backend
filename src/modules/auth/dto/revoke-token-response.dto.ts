import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for token revocation response
 */
export class RevokeTokenResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Token revoked successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp when token was revoked',
    example: '2025-11-19T10:30:00.000Z',
  })
  revokedAt: Date;
}
