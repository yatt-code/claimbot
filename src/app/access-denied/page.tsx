'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AccessDeniedPage() {
  const router = useRouter();

  useEffect(() => {
    // Show the access denied toast
    toast.error('You do not have permission to access that page', {
      icon: '🚫',
      id: 'access-denied',
      duration: 6000,
    });

    // Redirect to dashboard after a short delay
    const timeout = setTimeout(() => {
      router.replace('/dashboard');
    }, 1000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-4">
          You don&apos;t have permission to access that page.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting you to the dashboard...
        </p>
      </div>
    </div>
  );
}