import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for authentication errors
 */
export class AuthException extends HttpException {
  constructor(code: string, message: string) {
    super(
      {
        error: code,
        message,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

/**
 * Custom exception for authorization errors
 */
export class ForbiddenException extends HttpException {
  constructor(code: string, message: string) {
    super(
      {
        error: code,
        message,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * Custom exception for validation errors
 */
export class ValidationException extends HttpException {
  constructor(code: string, message: string, details?: any) {
    super(
      {
        error: code,
        message,
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Custom exception for conflict errors (e.g., order cannot be cancelled)
 */
export class ConflictException extends HttpException {
  constructor(code: string, message: string) {
    super(
      {
        error: code,
        message,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Error codes enum for consistent error handling
 */
export enum ErrorCodes {
  // Authentication errors
  AUTH_001 = 'AUTH_001',
  AUTH_002 = 'AUTH_002',
  AUTH_003 = 'AUTH_003',
  AUTH_004 = 'AUTH_004',
  AUTH_005 = 'AUTH_005',
  AUTH_006 = 'AUTH_006',

  // Drone errors
  DRONE_001 = 'DRONE_001',
  DRONE_002 = 'DRONE_002',

  // Order errors
  ORDER_001 = 'ORDER_001',
  ORDER_002 = 'ORDER_002',
  ORDER_003 = 'ORDER_003',

  // Validation errors
  VALIDATION_001 = 'VALIDATION_001',

  // Rate limiting
  RATE_LIMIT_001 = 'RATE_LIMIT_001',
}

/**
 * Error messages mapped to error codes
 */
export const ErrorMessages = {
  [ErrorCodes.AUTH_001]: 'Invalid or expired access token',
  [ErrorCodes.AUTH_002]: 'Insufficient permissions',
  [ErrorCodes.AUTH_003]: 'Invalid or expired refresh token',
  [ErrorCodes.AUTH_004]: 'Refresh token already used (replay attack prevention)',
  [ErrorCodes.AUTH_005]: 'Refresh token revoked',
  [ErrorCodes.AUTH_006]: 'Too many authentication attempts',
  [ErrorCodes.DRONE_001]: 'Drone not found',
  [ErrorCodes.DRONE_002]: 'Drone already assigned to job',
  [ErrorCodes.ORDER_001]: 'Order not found',
  [ErrorCodes.ORDER_002]: 'Order cannot be cancelled',
  [ErrorCodes.ORDER_003]: 'Order outside service area',
  [ErrorCodes.VALIDATION_001]: 'Invalid input format',
  [ErrorCodes.RATE_LIMIT_001]: 'Rate limit exceeded',
};
