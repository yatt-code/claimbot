'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission?: string;
  roles?: string[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useUser();
  const rbac = useRBAC();
  const pathname = usePathname();

  // Define navigation items with their permissions
  const navItems: NavItem[] = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: '📊',
    },
    {
      href: '/admin/approvals',
      label: 'Approvals',
      icon: '✅',
      permission: 'claims:approve',
    },
    {
      href: '/admin/users',
      label: 'Users',
      icon: '👥',
      permission: 'users:read:all',
    },
    {
      href: '/admin/locations',
      label: 'Locations',
      icon: '📍',
      permission: 'locations:read:all', // Assuming a permission for location management
    },
    {
      href: '/admin/trip-templates',
      label: 'Trip Templates',
      icon: '🗺️', // Using a map emoji for trip templates
      permission: 'admin:access:trip-templates', // New permission for admin trip templates
    },
    {
      href: '/admin/rates',
      label: 'Rates',
      icon: '💰',
      permission: 'config:update',
    },
    {
      href: '/admin/analytics',
      label: 'Analytics',
      icon: '📊',
      permission: 'analytics:read:basic',
    },
    {
      href: '/admin/reports',
      label: 'Reports',
      icon: '📈',
      permission: 'reports:read:all',
    },
    {
      href: '/admin/audit-logs',
      label: 'Audit Logs',
      icon: '📜',
      permission: 'audit:read',
    },
  ];

  // Filter navigation items based on user permissions
  const visibleNavItems = navItems.filter(item => {
    if (!item.permission) return true; // Always show items without permissions (like Dashboard)
    return rbac.hasPermission(item.permission);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Role Badge */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Current Role</p>
              <div className="flex flex-wrap gap-1">
                {rbac.userRoles.map((role) => (
                  <span
                    key={role}
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      {
                        'bg-purple-100 text-purple-800': role === 'superadmin',
                        'bg-red-100 text-red-800': role === 'admin',
                        'bg-blue-100 text-blue-800': role === 'manager',
                        'bg-green-100 text-green-800': role === 'finance',
                        'bg-gray-100 text-gray-800': role === 'staff',
                      }
                    )}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {navItems.find(item => item.href === pathname)?.label || 'Admin Panel'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your organization&apos;s data and settings
                </p>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                >
                  <span>🏠</span>
                  <span>Staff Dashboard</span>
                </Link>
                
                <Link
                  href="/auth/profile"
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                >
                  <span>👤</span>
                  <span>Profile</span>
                </Link>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}