import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import {
  AuthException,
  ErrorCodes,
  ErrorMessages,
} from '../../../common/exceptions/custom-exceptions';

/**
 * JWT authentication strategy
 * Validates JWT access tokens and extracts user information
 * Used by JwtAuthGuard to protect routes
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      // Extract JWT from Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Reject expired tokens
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  /**
   * Validate the JWT payload
   * This method is called after token signature is verified
   * Return value is attached to request.user
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // Verify this is an access token (not a refresh token)
    if (payload.token_type !== 'access') {
      throw new AuthException(ErrorCodes.AUTH_001, ErrorMessages[ErrorCodes.AUTH_001]);
    }

    // Payload is already validated by passport-jwt
    // Just return it to be attached to request
    return payload;
  }
}
