import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '../enums/index';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ForbiddenException, ErrorCodes, ErrorMessages } from '../exceptions/custom-exceptions';

/**
 * Role-based authorization guard
 * Checks if authenticated user has required role(s) for the endpoint
 * Must be used after JwtAuthGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from route metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Extract user from request (set by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException(ErrorCodes.AUTH_002, ErrorMessages[ErrorCodes.AUTH_002]);
    }

    // Check if user has one of the required roles
    const hasRole = requiredRoles.some((role) => user.type === role);

    if (!hasRole) {
      throw new ForbiddenException(ErrorCodes.AUTH_002, ErrorMessages[ErrorCodes.AUTH_002]);
    }

    return true;
  }
}
