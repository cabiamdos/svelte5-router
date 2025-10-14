/**
 * Built-in route guards
 *
 * @module guards/builtin
 * @category Core
 */

import type { GuardFunction } from './types';

/**
 * Authentication guard - checks if user is authenticated
 */
export const authGuard = (
  checkAuth: () => boolean | Promise<boolean>,
  redirectPath: string = '/login'
): GuardFunction => {
  return async (context) => {
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
      return { redirect: redirectPath };
    }
    return true;
  };
};

/**
 * Role-based guard - checks if user has required role
 */
export const roleGuard = (
  requiredRoles: string[],
  getUserRoles: () => string[] | Promise<string[]>,
  redirectPath: string = '/unauthorized'
): GuardFunction => {
  return async (context) => {
    const userRoles = await getUserRoles();
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return { redirect: redirectPath };
    }
    return true;
  };
};

/**
 * Permission-based guard - checks if user has specific permissions
 */
export const permissionGuard = (
  requiredPermissions: string[],
  getUserPermissions: () => string[] | Promise<string[]>,
  redirectPath: string = '/forbidden'
): GuardFunction => {
  return async (context) => {
    const userPermissions = await getUserPermissions();
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return { redirect: redirectPath };
    }
    return true;
  };
};

/**
 * Time-based guard - checks if access is allowed during specific time periods
 */
export const timeGuard = (
  allowedHours: { start: number; end: number },
  redirectPath: string = '/unavailable'
): GuardFunction => {
  return (context) => {
    const currentHour = new Date().getHours();
    const isAllowed = currentHour >= allowedHours.start && currentHour <= allowedHours.end;

    if (!isAllowed) {
      return { redirect: redirectPath };
    }
    return true;
  };
};

/**
 * Rate limiting guard - prevents too many rapid navigations
 */
export const rateLimitGuard = (
  maxRequests: number = 10,
  windowMs: number = 60000
): GuardFunction => {
  const requests: number[] = [];

  return (context) => {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old requests
    while (requests.length > 0 && requests[0]! < windowStart) {
      requests.shift();
    }

    if (requests.length >= maxRequests) {
      return false; // Deny access
    }

    requests.push(now);
    return true;
  };
};

/**
 * Feature flag guard - checks if a feature is enabled
 */
export const featureFlagGuard = (
  flagName: string,
  isFeatureEnabled: (flag: string) => boolean | Promise<boolean>,
  redirectPath: string = '/not-found'
): GuardFunction => {
  return async (context) => {
    const isEnabled = await isFeatureEnabled(flagName);
    if (!isEnabled) {
      return { redirect: redirectPath };
    }
    return true;
  };
};