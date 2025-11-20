import { SetMetadata } from '@nestjs/common';
import { UserType } from '../enums/index';

/**
 * Decorator to specify which user types can access an endpoint
 *
 * Usage:
 * @Roles(UserType.ADMIN)
 * @Get('/admin-only')
 * async adminEndpoint() { ... }
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);
