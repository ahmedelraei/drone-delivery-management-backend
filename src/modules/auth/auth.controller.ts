import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TokenRequestDto } from './dto/token-request.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { RevokeTokenResponseDto } from './dto/revoke-token-response.dto';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Authentication controller
 * Handles token generation, refresh, and revocation
 * These endpoints are public (no JWT required)
 */
@ApiTags('Authentication')
@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Generate new access and refresh token pair
   * POST /api/v1/auth/token
   */
  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate access and refresh tokens' })
  @ApiResponse({
    status: 200,
    description: 'Tokens generated successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async generateToken(@Body() tokenRequest: TokenRequestDto): Promise<TokenResponseDto> {
    return this.authService.generateTokens(tokenRequest);
  }

  /**
   * Refresh access token using refresh token
   * POST /api/v1/auth/refresh
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(@Body() refreshRequest: RefreshTokenRequestDto): Promise<TokenResponseDto> {
    return this.authService.refreshTokens(refreshRequest);
  }

  /**
   * Revoke refresh token (logout)
   * POST /api/v1/auth/revoke
   */
  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh token (logout)' })
  @ApiResponse({
    status: 200,
    description: 'Token revoked successfully',
    type: RevokeTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async revokeToken(
    @Body() refreshRequest: RefreshTokenRequestDto,
  ): Promise<RevokeTokenResponseDto> {
    return this.authService.revokeToken(refreshRequest.refreshToken);
  }
}
