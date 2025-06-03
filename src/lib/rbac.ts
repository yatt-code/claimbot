import { UserRole } from '@/models/User';

/**
 * Enhanced RBAC (Role-Based Access Control) System
 * Provides comprehensive role management and permission checking
 */

// Define role hierarchy - higher roles inherit permissions from lower ones
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  staff: 1,
  manager: 2,
  finance: 3,
  admin: 4,
  superadmin: 5
} as const;

// Define permission sets for each role
export const ROLE_PERMISSIONS = {
  staff: [
    'claims:create',
    'claims:read:own',
    'claims:update:own',
    'overtime:create',
    'overtime:read:own',
    'overtime:update:own',
    'files:upload',
    'files:read:own',
    'profile:read:own',
    'profile:update:own'
  ],
  manager: [
    'claims:approve',
    'claims:read:team',
    'overtime:approve',
    'overtime:read:team',
    'users:read:team',
    'reports:read:team'
  ],
  finance: [
    'claims:read:all',
    'overtime:read:all',
    'reports:read:all',
    'reports:export',
    'claims:update:status',
    'overtime:update:status'
  ],
  admin: [
    'users:create',
    'users:read:all',
    'users:update:all',
    'users:delete',
    'rates:create',
    'rates:update',
    'rates:delete',
    'audit-logs:read',
    'system:config'
  ],
  superadmin: [
    'roles:manage',
    'system:admin',
    'users:impersonate',
    'data:export:all',
    'system:maintenance'
  ]
} as const;

/**
 * Get all permissions for a given set of roles
 */
export function getPermissionsForRoles(userRoles: UserRole[]): string[] {
  const permissions = new Set<string>();
  
  for (const role of userRoles) {
    // Add direct permissions for this role
    ROLE_PERMISSIONS[role]?.forEach(permission => permissions.add(permission));
    
    // If user has superadmin, they get ALL permissions
    if (role === 'superadmin') {
      Object.values(ROLE_PERMISSIONS).flat().forEach(permission => permissions.add(permission));
      break; // No need to check other roles
    }
    
    // Add inherited permissions from lower roles
    const currentRoleLevel = ROLE_HIERARCHY[role];
    if (currentRoleLevel) {
      Object.entries(ROLE_HIERARCHY).forEach(([inheritRole, level]) => {
        if (level < currentRoleLevel) {
          ROLE_PERMISSIONS[inheritRole as UserRole]?.forEach(permission => permissions.add(permission));
        }
      });
    }
  }
  
  return Array.from(permissions);
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRoles: UserRole[], permission: string): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  
  // Superadmin has all permissions
  if (userRoles.includes('superadmin')) return true;
  
  const userPermissions = getPermissionsForRoles(userRoles);
  return userPermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userRoles: UserRole[], permissions: string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes('superadmin')) return true;
  
  const userPermissions = getPermissionsForRoles(userRoles);
  return permissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userRoles: UserRole[], permissions: string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes('superadmin')) return true;
  
  const userPermissions = getPermissionsForRoles(userRoles);
  return permissions.every(permission => userPermissions.includes(permission));
}

/**
 * Enhanced role checking with hierarchy support
 */
export function hasRole(userRoles: UserRole[], requiredRole: UserRole): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  
  // Direct role check
  if (userRoles.includes(requiredRole)) return true;
  
  // Superadmin has all roles
  if (userRoles.includes('superadmin')) return true;
  
  // Check if user has a higher role in hierarchy
  const requiredLevel = ROLE_HIERARCHY[requiredRole];
  return userRoles.some(role => {
    const userLevel = ROLE_HIERARCHY[role];
    return userLevel >= requiredLevel;
  });
}

/**
 * Check if user has any of the specified roles (with hierarchy)
 */
export function hasAnyRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (userRoles.includes('superadmin')) return true;
  
  return requiredRoles.some(role => hasRole(userRoles, role));
}

/**
 * Route protection configuration
 */
export interface RouteConfig {
  path: string;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  isApiRoute?: boolean;
  allowHierarchy?: boolean; // Whether higher roles can access lower role routes
}

// Define protected routes with their requirements
export const PROTECTED_ROUTES: RouteConfig[] = [
  // Admin routes
  { 
    path: '/admin', 
    requiredRoles: ['admin', 'superadmin'],
    requiredPermissions: ['users:read:all'],
    allowHierarchy: true
  },
  { 
    path: '/api/admin', 
    requiredRoles: ['admin', 'superadmin'],
    requiredPermissions: ['users:read:all'],
    isApiRoute: true,
    allowHierarchy: true
  },
  
  // Manager routes
  { 
    path: '/manager', 
    requiredRoles: ['manager', 'admin', 'superadmin'],
    requiredPermissions: ['claims:approve'],
    allowHierarchy: true
  },
  { 
    path: '/api/manager', 
    requiredRoles: ['manager', 'admin', 'superadmin'],
    requiredPermissions: ['claims:approve'],
    isApiRoute: true,
    allowHierarchy: true
  },
  
  // Finance routes
  { 
    path: '/finance', 
    requiredRoles: ['finance', 'admin', 'superadmin'],
    requiredPermissions: ['reports:read:all'],
    allowHierarchy: true
  },
  { 
    path: '/api/finance', 
    requiredRoles: ['finance', 'admin', 'superadmin'],
    requiredPermissions: ['reports:read:all'],
    isApiRoute: true,
    allowHierarchy: true
  },
  
  // Role management (superadmin only)
  {
    path: '/api/admin/users',
    requiredRoles: ['superadmin'],
    requiredPermissions: ['roles:manage'],
    isApiRoute: true,
    allowHierarchy: false
  }
];

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(userRoles: UserRole[], path: string): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  
  // Superadmin has access to everything
  if (userRoles.includes('superadmin')) return true;
  
  // Find matching route config
  const routeConfig = PROTECTED_ROUTES.find(config => path.startsWith(config.path));
  
  // If no specific config, allow access (public route)
  if (!routeConfig) return true;
  
  // Check role requirements
  if (routeConfig.requiredRoles) {
    const hasRequiredRole = routeConfig.allowHierarchy 
      ? hasAnyRole(userRoles, routeConfig.requiredRoles)
      : routeConfig.requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) return false;
  }
  
  // Check permission requirements
  if (routeConfig.requiredPermissions) {
    if (!hasAllPermissions(userRoles, routeConfig.requiredPermissions)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Role validation utilities
 */
export function validateRoles(roles: string[]): UserRole[] {
  const validRoles: UserRole[] = ['staff', 'manager', 'finance', 'admin', 'superadmin'];
  return roles.filter((role): role is UserRole => validRoles.includes(role as UserRole));
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    staff: 'Staff Member',
    manager: 'Manager',
    finance: 'Finance Officer',
    admin: 'Administrator',
    superadmin: 'Super Administrator'
  };
  return displayNames[role] || role;
}

/**
 * Check if one role can manage another role
 */
export function canManageRole(managerRoles: UserRole[], targetRole: UserRole): boolean {
  if (managerRoles.includes('superadmin')) return true;
  
  const managerLevel = Math.max(...managerRoles.map(role => ROLE_HIERARCHY[role] || 0));
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
  
  // Can only manage roles at same level or below, except superadmin can't be managed by admin
  if (targetRole === 'superadmin') return managerRoles.includes('superadmin');
  
  return managerLevel > targetLevel;
}