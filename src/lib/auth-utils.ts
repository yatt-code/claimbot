import { auth, clerkClient } from '@clerk/nextjs/server';
import { UserRole } from '@/models/User';
import { canAccessRoute, hasPermission, hasAnyPermission, hasRole, hasAnyRole } from './rbac';

/**
 * Enhanced Authentication Utilities with improved RBAC
 */

// Type definition for Clerk session claims with our custom metadata
interface ClerkSessionClaims {
  publicMetadata?: {
    roles?: UserRole[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Helper function to safely extract roles from session (deprecated)
function extractRolesFromSession(sessionClaims: unknown): UserRole[] {
  const claims = sessionClaims as ClerkSessionClaims;
  return claims?.publicMetadata?.roles || [];
}

// Helper function to safely extract roles from Clerk user
async function extractRolesFromUser(userId: string): Promise<UserRole[]> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const roles = user?.publicMetadata?.roles as UserRole[] | undefined;
    return roles || [];
  } catch (error) {
    console.error('Error extracting roles from user:', error);
    return [];
  }
}

/**
 * Get the user's roles from Clerk's session
 */
export async function getUserRoles(): Promise<UserRole[]> {
  const session = await auth();
  if (!session || !session.userId) return [];
  
  // Get roles from session claims (public metadata)
  return extractRolesFromSession(session.sessionClaims);
}

/**
 * Get the current user's ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.userId || null;
}

/**
 * Check if the current user has a specific role
 */
export async function userHasRole(role: UserRole): Promise<boolean> {
  const roles = await getUserRoles();
  return hasRole(roles, role);
}

/**
 * Check if the current user has any of the specified roles
 */
export async function userHasAnyRole(requiredRoles: UserRole[]): Promise<boolean> {
  const userRoles = await getUserRoles();
  return hasAnyRole(userRoles, requiredRoles);
}

/**
 * Check if the current user has a specific permission
 */
export async function userHasPermission(permission: string): Promise<boolean> {
  const userRoles = await getUserRoles();
  return hasPermission(userRoles, permission);
}

/**
 * Check if the current user has any of the specified permissions
 */
export async function userHasAnyPermission(permissions: string[]): Promise<boolean> {
  const userRoles = await getUserRoles();
  return hasAnyPermission(userRoles, permissions);
}

/**
 * Check if the current user has access to a specific path
 */
export async function canAccessPath(path: string): Promise<boolean> {
  const userRoles = await getUserRoles();
  return canAccessRoute(userRoles, path);
}

/**
 * Middleware to check if user is authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session || !session.userId) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Middleware to check if user has a specific role
 */
export async function requireRole(role: UserRole) {
  const session = await requireAuth();
  const roles = extractRolesFromSession(session.sessionClaims);
  
  if (!roles || !hasRole(roles, role)) {
    throw new Error('Forbidden: Insufficient role permissions');
  }
  
  return session;
}

/**
 * Middleware to check if user has any of the specified roles
 */
export async function requireAnyRole(requiredRoles: UserRole[]) {
  const session = await requireAuth();
  const userRoles = extractRolesFromSession(session.sessionClaims);
  
  if (!userRoles || !hasAnyRole(userRoles, requiredRoles)) {
    throw new Error('Forbidden: Insufficient role permissions');
  }
  
  return session;
}

/**
 * Middleware to check if user has a specific permission
 */
export async function requirePermission(permission: string) {
  const session = await requireAuth();
  const userRoles = extractRolesFromSession(session.sessionClaims);
  
  if (!userRoles || !hasPermission(userRoles, permission)) {
    throw new Error(`Forbidden: Missing permission '${permission}'`);
  }
  
  return session;
}

/**
 * Middleware to check if user has any of the specified permissions
 */
export async function requireAnyPermission(permissions: string[]) {
  const session = await requireAuth();
  const userRoles = extractRolesFromSession(session.sessionClaims);
  
  if (!userRoles || !hasAnyPermission(userRoles, permissions)) {
    throw new Error(`Forbidden: Missing required permissions`);
  }
  
  return session;
}

/**
 * Enhanced route protection for API routes
 */
export async function protectApiRoute(options: {
  roles?: UserRole[];
  permissions?: string[];
  requireAll?: boolean; // Whether to require all roles/permissions or just any
}) {
  const session = await requireAuth();
  const userRoles = await extractRolesFromUser(session.userId);
  
  if (!userRoles || userRoles.length === 0) {
    throw new Error('Forbidden: No roles assigned');
  }
  
  // Check role requirements
  if (options.roles && options.roles.length > 0) {
    const hasRequiredRoles = options.requireAll
      ? options.roles.every(role => hasRole(userRoles, role))
      : hasAnyRole(userRoles, options.roles);
    
    if (!hasRequiredRoles) {
      throw new Error('Forbidden: Insufficient role permissions');
    }
  }
  
  // Check permission requirements
  if (options.permissions && options.permissions.length > 0) {
    const hasRequiredPermissions = options.requireAll
      ? options.permissions.every(permission => hasPermission(userRoles, permission))
      : hasAnyPermission(userRoles, options.permissions);
    
    if (!hasRequiredPermissions) {
      throw new Error('Forbidden: Insufficient permissions');
    }
  }
  
  return session;
}
