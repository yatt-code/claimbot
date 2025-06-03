'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ManagerApprovalDetailRedirectProps {
  params: {
    id: string;
  };
}

export default function ManagerApprovalDetailRedirect({ params }: ManagerApprovalDetailRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new admin approval detail page
    router.replace(`/admin/approvals/${params.id}`);
  }, [router, params.id]);

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