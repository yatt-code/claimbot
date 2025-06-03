import { UserRole } from '@/models/User';

/**
 * Check if a user has a specific role
 * @param userRoles - The user's roles array
 * @param requiredRole - The role to check for
 * @returns boolean - True if the user has the required role or is a superadmin
 */
export function hasRole(userRoles: UserRole[] = [], requiredRole: UserRole): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.includes('superadmin') || userRoles.includes(requiredRole);
}

/**
 * Check if a user has any of the specified roles
 * @param userRoles - The user's roles array
 * @param requiredRoles - Array of roles to check against
 * @returns boolean - True if the user has any of the required roles or is a superadmin
 */
export function hasAnyRole(userRoles: UserRole[] = [], requiredRoles: UserRole[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes('superadmin')) return true;
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Check if a user has all of the specified roles
 * @param userRoles - The user's roles array
 * @param requiredRoles - Array of roles that must all be present
 * @returns boolean - True if the user has all required roles or is a superadmin
 */
export function hasAllRoles(userRoles: UserRole[] = [], requiredRoles: UserRole[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes('superadmin')) return true;
  return requiredRoles.every(role => userRoles.includes(role));
}

/**
 * Middleware to protect routes based on roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Middleware function for route protection
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return async (req: any, res: any, next: any) => {
    const user = req.user; // Assuming user is attached to request by auth middleware
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (hasAnyRole(user.roles, allowedRoles)) {
      return next();
    }
    
    return res.status(403).json({ error: 'Insufficient permissions' });
  };
}
