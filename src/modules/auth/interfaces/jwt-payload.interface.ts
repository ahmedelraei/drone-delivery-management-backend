import { UserType } from '../../../common/enums/index';

/**
 * JWT payload interface for access tokens
 * Contains user identification and authorization information
 */
export interface JwtPayload {
  sub: string; // User ID
  name: string; // User name
  type: UserType; // User type for authorization
  iat?: number; // Issued at
  exp?: number; // Expiration time
  token_type: 'access';
}

/**
 * JWT payload interface for refresh tokens
 * Includes JTI for revocation tracking
 */
export interface RefreshJwtPayload {
  sub: string; // User ID
  jti: string; // JWT ID for revocation
  type: UserType; // User type
  iat?: number; // Issued at
  exp?: number; // Expiration time
  token_type: 'refresh';
}
