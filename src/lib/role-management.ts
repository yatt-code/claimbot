import { UserRole } from '@/models/User';
import { canManageRole, getRoleDisplayName, validateRoles } from './rbac';

/**
 * Role Management Utilities for Admin Interface
 */

export interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
  disabled?: boolean;
}

/**
 * Get available role options for a user with specific manager roles
 */
export function getAvailableRoles(managerRoles: UserRole[]): RoleOption[] {
  const allRoles: RoleOption[] = [
    {
      value: 'staff',
      label: getRoleDisplayName('staff'),
      description: 'Basic user with access to submit claims and overtime requests'
    },
    {
      value: 'manager',
      label: getRoleDisplayName('manager'),
      description: 'Can approve team submissions and view team reports'
    },
    {
      value: 'finance',
      label: getRoleDisplayName('finance'),
      description: 'Can view all financial data and generate reports'
    },
    {
      value: 'admin',
      label: getRoleDisplayName('admin'),
      description: 'Full system administration except role management'
    },
    {
      value: 'superadmin',
      label: getRoleDisplayName('superadmin'),
      description: 'Complete system control including role management'
    }
  ];

  // Filter roles based on what the manager can assign
  return allRoles.map(role => ({
    ...role,
    disabled: !canManageRole(managerRoles, role.value)
  }));
}

/**
 * Get role combinations that make sense
 */
export function getCommonRoleCombinations(): { roles: UserRole[]; label: string; description: string }[] {
  return [
    {
      roles: ['staff'],
      label: 'Staff Member',
      description: 'Basic employee access - can submit claims and overtime'
    },
    {
      roles: ['staff', 'manager'],
      label: 'Team Manager',
      description: 'Can submit own requests and approve team submissions'
    },
    {
      roles: ['staff', 'finance'],
      label: 'Finance Officer',
      description: 'Can submit requests and access financial reports'
    },
    {
      roles: ['staff', 'manager', 'finance'],
      label: 'Finance Manager',
      description: 'Combined manager and finance responsibilities'
    },
    {
      roles: ['staff', 'admin'],
      label: 'System Administrator',
      description: 'Full system administration except role management'
    },
    {
      roles: ['staff', 'superadmin'],
      label: 'Super Administrator',
      description: 'Complete system control with all permissions'
    }
  ];
}

/**
 * Validate role assignment rules
 */
export function validateRoleAssignment(
  assignedRoles: UserRole[],
  managerRoles: UserRole[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate role format
  const validRoles = validateRoles(assignedRoles);
  if (validRoles.length !== assignedRoles.length) {
    errors.push('Invalid roles detected');
  }

  // Check if manager can assign these roles
  for (const role of validRoles) {
    if (!canManageRole(managerRoles, role)) {
      errors.push(`You don't have permission to assign the ${getRoleDisplayName(role)} role`);
    }
  }

  // Business rules
  if (validRoles.length === 0) {
    errors.push('At least one role must be assigned');
  }

  // Staff role should always be included (enforce this rule)
  if (!validRoles.includes('staff')) {
    errors.push('Staff role is required for all users');
  }

  // Superadmin and admin shouldn't be combined (optional business rule)
  if (validRoles.includes('superadmin') && validRoles.includes('admin')) {
    errors.push('Superadmin role already includes admin permissions');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Suggest optimal role combinations
 */
export function suggestRoles(currentRoles: UserRole[]): { suggested: UserRole[]; reason: string } {
  // If user has superadmin, they don't need other roles
  if (currentRoles.includes('superadmin')) {
    return {
      suggested: ['staff', 'superadmin'],
      reason: 'Superadmin includes all other permissions'
    };
  }

  // If user has admin, they don't need manager/finance
  if (currentRoles.includes('admin')) {
    return {
      suggested: ['staff', 'admin'],
      reason: 'Admin role includes manager and finance permissions'
    };
  }

  // Ensure staff is always included
  const suggested = [...new Set(['staff', ...currentRoles])];
  
  return {
    suggested: suggested as UserRole[],
    reason: 'Added staff role as it\'s required for all users'
  };
}

/**
 * Get role hierarchy information
 */
export function getRoleHierarchyInfo() {
  return {
    hierarchy: [
      { role: 'staff', level: 1, description: 'Base level access' },
      { role: 'manager', level: 2, description: 'Team management capabilities' },
      { role: 'finance', level: 3, description: 'Financial data access' },
      { role: 'admin', level: 4, description: 'System administration' },
      { role: 'superadmin', level: 5, description: 'Complete system control' }
    ],
    inheritance: 'Higher roles automatically inherit permissions from lower roles'
  };
}