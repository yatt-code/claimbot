'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ErrorHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error && message) {
      const decodedMessage = decodeURIComponent(message);
      
      switch (error) {
        case 'access_denied':
          toast.error(decodedMessage, {
            icon: '🚫',
            id: 'access-denied', // Prevent duplicate toasts
          });
          break;
        case 'system_error':
          toast.error(decodedMessage, {
            icon: '⚠️',
            id: 'system-error',
          });
          break;
        default:
          toast.error(decodedMessage, {
            id: 'general-error',
          });
      }

      // Clean up the URL parameters after showing the toast
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('message');
      
      // Replace the current URL without the error parameters
      router.replace(url.pathname + (url.search ? url.search : ''), { scroll: false });
    }
  }, [searchParams, router]);

  // This component doesn't render anything visible
  return null;
}