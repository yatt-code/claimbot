'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface QuickAction {
  href: string;
  label: string;
  icon: string;
  description: string;
  permission?: string;
  variant?: 'default' | 'outline' | 'secondary';
}

export default function QuickActions() {
  const rbac = useRBAC();

  // Define all possible quick actions
  const allActions: QuickAction[] = [
    {
      href: '/admin/approvals',
      label: 'Review Approvals',
      icon: '✅',
      description: 'Pending claims & overtime',
      permission: 'claims:approve',
      variant: 'default',
    },
    {
      href: '/admin/users',
      label: 'Manage Users',
      icon: '👥',
      description: 'Add, edit, or remove users',
      permission: 'users:read:all',
      variant: 'outline',
    },
    {
      href: '/admin/rates',
      label: 'Configure Rates',
      icon: '💰',
      description: 'Update system rates',
      permission: 'config:update',
      variant: 'outline',
    },
    {
      href: '/admin/reports',
      label: 'View Reports',
      icon: '📊',
      description: 'Analytics & insights',
      permission: 'reports:read:all',
      variant: 'outline',
    },
    {
      href: '/submit/expense',
      label: 'Submit Expense',
      icon: '💳',
      description: 'Quick expense submission',
      variant: 'secondary',
    },
    {
      href: '/submit/overtime',
      label: 'Submit Overtime',
      icon: '⏰',
      description: 'Request overtime pay',
      variant: 'secondary',
    },
    {
      href: '/admin/audit-logs',
      label: 'Audit Logs',
      icon: '📜',
      description: 'System activity logs',
      permission: 'audit:read',
      variant: 'outline',
    },
    {
      href: '/my-submissions',
      label: 'My Submissions',
      icon: '📋',
      description: 'Track your requests',
      variant: 'secondary',
    },
  ];

  // Filter actions based on permissions
  const visibleActions = allActions.filter(action => {
    if (!action.permission) return true; // Always show actions without permissions
    return rbac.hasPermission(action.permission);
  });

  // Organize actions by priority/category
  const primaryActions = visibleActions.filter(action => action.variant === 'default');
  const adminActions = visibleActions.filter(action => action.variant === 'outline');
  const userActions = visibleActions.filter(action => action.variant === 'secondary');

  return (
    <div className="space-y-6">
      {/* Primary Actions (Most Important) */}
      {primaryActions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Priority Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {primaryActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Button className="w-full h-20 text-left justify-start p-4" variant={action.variant}>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{action.icon}</span>
                    <div>
                      <div className="font-medium">{action.label}</div>
                      <div className="text-sm opacity-75">{action.description}</div>
                    </div>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Admin Actions */}
      {adminActions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Administration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Button className="w-full h-20 text-center" variant={action.variant}>
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xl">{action.icon}</span>
                    <div className="text-sm font-medium">{action.label}</div>
                    <div className="text-xs opacity-75">{action.description}</div>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* User Actions */}
      {userActions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Access</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {userActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Button className="w-full h-16 text-center" variant={action.variant} size="sm">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-lg">{action.icon}</span>
                    <div className="text-xs font-medium">{action.label}</div>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* No actions available */}
      {visibleActions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">🔒</div>
          <p className="text-gray-500">No actions available with your current permissions.</p>
        </div>
      )}
    </div>
  );
}