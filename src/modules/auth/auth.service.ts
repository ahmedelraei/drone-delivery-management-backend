import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../user/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { TokenRequestDto } from './dto/token-request.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token-request.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { RevokeTokenResponseDto } from './dto/revoke-token-response.dto';
import { JwtPayload, RefreshJwtPayload } from './interfaces/jwt-payload.interface';
import {
  AuthException,
  ErrorCodes,
  ErrorMessages,
} from '../../common/exceptions/custom-exceptions';

/**
 * Authentication service
 * Handles JWT token generation, refresh, and revocation
 * Implements secure token rotation strategy
 */
@Injectable()
export class AuthService {
  private readonly accessTokenExpiration: number;
  private readonly refreshTokenExpiration: number;
  private readonly maxRefreshTokensPerUser = 5;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.accessTokenExpiration = this.configService.get<number>('jwt.accessTokenExpiration') ?? 900;
    this.refreshTokenExpiration =
      this.configService.get<number>('jwt.refreshTokenExpiration') ?? 604800;
  }

  /**
   * Generate new access and refresh token pair
   * Creates or updates user in database
   */
  async generateTokens(tokenRequest: TokenRequestDto): Promise<TokenResponseDto> {
    // Find or create user (simplified authentication for this system)
    let user = await this.userRepository.findOne({
      where: { name: tokenRequest.name, type: tokenRequest.type },
    });

    if (!user) {
      // Create new user if doesn't exist
      user = this.userRepository.create({
        name: tokenRequest.name,
        type: tokenRequest.type,
        isActive: true,
      });
      await this.userRepository.save(user);
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate token pair
    const tokens = await this.createTokenPair(user);

    return {
      ...tokens,
      userType: user.type,
    };
  }

  /**
   * Refresh access token using refresh token
   * Implements token rotation - old refresh token is invalidated
   */
  async refreshTokens(refreshRequest: RefreshTokenRequestDto): Promise<TokenResponseDto> {
    // Decode refresh token (without verification yet)
    let payload: RefreshJwtPayload;
    try {
      payload = this.jwtService.decode(refreshRequest.refreshToken) as RefreshJwtPayload;
    } catch {
      throw new AuthException(ErrorCodes.AUTH_003, ErrorMessages[ErrorCodes.AUTH_003]);
    }

    if (!payload || !payload.jti) {
      throw new AuthException(ErrorCodes.AUTH_003, ErrorMessages[ErrorCodes.AUTH_003]);
    }

    // Find refresh token in database
    const tokenHash = this.hashToken(refreshRequest.refreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new AuthException(ErrorCodes.AUTH_003, ErrorMessages[ErrorCodes.AUTH_003]);
    }

    // Check if token is revoked
    if (storedToken.isRevoked) {
      throw new AuthException(ErrorCodes.AUTH_005, ErrorMessages[ErrorCodes.AUTH_005]);
    }

    // Check if token was already used (replay attack detection)
    if (storedToken.lastUsedAt) {
      // Token reuse detected - revoke all tokens for this user
      await this.revokeAllUserTokens(storedToken.userId);
      throw new AuthException(ErrorCodes.AUTH_004, ErrorMessages[ErrorCodes.AUTH_004]);
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      throw new AuthException(ErrorCodes.AUTH_003, ErrorMessages[ErrorCodes.AUTH_003]);
    }

    // Verify JWT signature
    try {
      this.jwtService.verify(refreshRequest.refreshToken);
    } catch {
      throw new AuthException(ErrorCodes.AUTH_003, ErrorMessages[ErrorCodes.AUTH_003]);
    }

    // Mark old token as used
    storedToken.lastUsedAt = new Date();
    await this.refreshTokenRepository.save(storedToken);

    // Revoke old token (one-time use)
    await this.revokeToken(refreshRequest.refreshToken);

    // Generate new token pair
    const tokens = await this.createTokenPair(storedToken.user);

    return tokens;
  }

  /**
   * Revoke a refresh token
   */
  async revokeToken(refreshToken: string): Promise<RevokeTokenResponseDto> {
    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });

    if (!storedToken) {
      throw new AuthException(ErrorCodes.AUTH_003, ErrorMessages[ErrorCodes.AUTH_003]);
    }

    storedToken.isRevoked = true;
    storedToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(storedToken);

    return {
      message: 'Token revoked successfully',
      revokedAt: storedToken.revokedAt,
    };
  }

  /**
   * Create access and refresh token pair for a user
   * Private helper method
   */
  private async createTokenPair(user: User): Promise<TokenResponseDto> {
    // Create access token payload
    const accessPayload: JwtPayload = {
      sub: user.id,
      name: user.name,
      type: user.type,
      token_type: 'access',
    };

    // Generate access token
    const accessToken = this.jwtService.sign(accessPayload, {
      expiresIn: this.accessTokenExpiration,
    });

    // Create refresh token payload with unique JTI
    const jti = uuidv4();
    const refreshPayload: RefreshJwtPayload = {
      sub: user.id,
      jti,
      type: user.type,
      token_type: 'refresh',
    };

    // Generate refresh token
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: this.refreshTokenExpiration,
    });

    // Store refresh token in database
    await this.storeRefreshToken(user.id, refreshToken, jti);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.accessTokenExpiration,
      refreshTokenExpiresIn: this.refreshTokenExpiration,
      tokenType: 'Bearer',
    };
  }

  /**
   * Store refresh token hash in database
   * Implements token limit per user (max 5 active tokens)
   */
  private async storeRefreshToken(userId: string, token: string, jti: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.refreshTokenExpiration);

    // Create refresh token record
    const refreshToken = this.refreshTokenRepository.create({
      userId,
      tokenHash,
      jti,
      expiresAt,
      isRevoked: false,
    });

    await this.refreshTokenRepository.save(refreshToken);

    // Clean up old tokens if user has too many
    await this.cleanupOldTokens(userId);
  }

  /**
   * Clean up old refresh tokens if user exceeds limit
   */
  private async cleanupOldTokens(userId: string): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
      order: { createdAt: 'DESC' },
    });

    // If user has more than max allowed tokens, revoke oldest ones
    if (tokens.length > this.maxRefreshTokensPerUser) {
      const tokensToRevoke = tokens.slice(this.maxRefreshTokensPerUser);
      for (const token of tokensToRevoke) {
        token.isRevoked = true;
        token.revokedAt = new Date();
      }
      await this.refreshTokenRepository.save(tokensToRevoke);
    }
  }

  /**
   * Revoke all refresh tokens for a user (used when replay attack detected)
   */
  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() },
    );
  }

  /**
   * Hash a token using SHA-256
   * Never store actual tokens in database
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
