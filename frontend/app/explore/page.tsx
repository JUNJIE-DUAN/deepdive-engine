'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Inner component that uses useSearchParams
 */
function ExploreRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      router.replace(`/resource/${id}`);
    } else {
      router.replace('/library');
    }
  }, [id, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
}

/**
 * Redirect page for legacy /explore?id= URLs
 * Redirects to /resource/[id]
 */
export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <ExploreRedirect />
    </Suspense>
  );
}
