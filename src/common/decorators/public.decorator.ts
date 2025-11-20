import { SetMetadata } from '@nestjs/common';

/**
 * Public decorator
 * Marks routes that don't require authentication
 *
 * Usage:
 * @Public()
 * @Get('/public-endpoint')
 * async publicEndpoint() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
