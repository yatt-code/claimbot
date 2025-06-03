'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ManagerApprovalsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new admin approvals page
    router.replace('/admin/approvals');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="text-6xl mb-4">🔄</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600 mb-4">
          Manager functionality has been moved to the Admin panel.
        </p>
        <p className="text-sm text-gray-500">
          Taking you to the new location...
        </p>
      </div>
    </div>
  );
}
