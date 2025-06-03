import { useUser } from '@clerk/nextjs';
import { UserRole } from '@/models/User';
import { hasRole, hasAnyRole, hasPermission, hasAnyPermission, canAccessRoute } from '@/lib/rbac';

/**
 * React hook for Role-Based Access Control in frontend components
 */
export function useRBAC() {
  const { user, isLoaded } = useUser();
  
  // Get user roles from Clerk metadata
  const userRoles = (user?.publicMetadata?.roles || []) as UserRole[];
  
  return {
    // Basic info
    isLoaded,
    userRoles,
    isAuthenticated: !!user,
    
    // Role checking functions
    hasRole: (role: UserRole) => hasRole(userRoles, role),
    hasAnyRole: (roles: UserRole[]) => hasAnyRole(userRoles, roles),
    
    // Permission checking functions
    hasPermission: (permission: string) => hasPermission(userRoles, permission),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(userRoles, permissions),
    
    // Route access checking
    canAccessRoute: (path: string) => canAccessRoute(userRoles, path),
    
    // Convenience role checks
    isStaff: () => hasRole(userRoles, 'staff'),
    isManager: () => hasRole(userRoles, 'manager'),
    isFinance: () => hasRole(userRoles, 'finance'),
    isAdmin: () => hasRole(userRoles, 'admin'),
    isSuperAdmin: () => hasRole(userRoles, 'superadmin'),
    
    // Common permission checks
    canCreateUsers: () => hasPermission(userRoles, 'users:create'),
    canManageRoles: () => hasPermission(userRoles, 'roles:manage'),
    canApproveSubmissions: () => hasPermission(userRoles, 'claims:approve'),
    canViewAllReports: () => hasPermission(userRoles, 'reports:read:all'),
    canConfigureSystem: () => hasPermission(userRoles, 'system:config'),
    
    // UI helper functions
    shouldShowAdminMenu: () => hasAnyRole(userRoles, ['admin', 'superadmin']),
    shouldShowManagerMenu: () => hasAnyRole(userRoles, ['manager', 'admin', 'superadmin']),
    shouldShowFinanceMenu: () => hasAnyRole(userRoles, ['finance', 'admin', 'superadmin']),
  };
}

/**
 * Component wrapper for role-based rendering
 */
interface RoleGuardProps {
  children: React.ReactNode;
  roles?: UserRole[];
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function RoleGuard({ 
  children, 
  roles, 
  permissions, 
  requireAll = false, 
  fallback = null 
}: RoleGuardProps) {
  const rbac = useRBAC();
  
  if (!rbac.isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!rbac.isAuthenticated) {
    return fallback;
  }
  
  // Check role requirements
  if (roles && roles.length > 0) {
    const hasRequiredRoles = requireAll 
      ? roles.every(role => rbac.hasRole(role))
      : rbac.hasAnyRole(roles);
    
    if (!hasRequiredRoles) {
      return fallback;
    }
  }
  
  // Check permission requirements
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? permissions.every(permission => rbac.hasPermission(permission))
      : rbac.hasAnyPermission(permissions);
    
    if (!hasRequiredPermissions) {
      return fallback;
    }
  }
  
  return <>{children}</>;
}

/**
 * Hook for permission-based conditional rendering
 */
export function usePermissionCheck() {
  const rbac = useRBAC();
  
  return {
    // Render helpers
    renderIfHasRole: (role: UserRole, component: React.ReactNode) => 
      rbac.hasRole(role) ? component : null,
    
    renderIfHasAnyRole: (roles: UserRole[], component: React.ReactNode) => 
      rbac.hasAnyRole(roles) ? component : null,
      
    renderIfHasPermission: (permission: string, component: React.ReactNode) => 
      rbac.hasPermission(permission) ? component : null,
      
    renderIfHasAnyPermission: (permissions: string[], component: React.ReactNode) => 
      rbac.hasAnyPermission(permissions) ? component : null,
  };
}