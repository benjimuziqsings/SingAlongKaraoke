
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useUser } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

const AUTH_ROUTES = ['/'];
const PROTECTED_ROUTES = ['/home', '/admin', '/reviews', '/profile'];

function GlobalLoadingSkeleton() {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4 w-full max-w-md p-8">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
}


function AuthHandler({ children }: { children: ReactNode }) {
  const { user, isUserLoading, isKJ } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Wait for user status to be confirmed

    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

    if (user && isAuthRoute) {
      if (isKJ) {
         router.push('/admin'); // Redirect KJs to admin dashboard
      } else {
         router.push('/home'); // Redirect logged-in users from auth pages to home
      }
    } else if (!user && isProtectedRoute) {
      router.push('/'); // Redirect unauthenticated users from protected pages to login
    }
  }, [isUserLoading, user, isKJ, pathname, router]);

  if (isUserLoading) {
    return <GlobalLoadingSkeleton />;
  }
  
  // Prevent rendering children on server-side if route is protected and user is not yet known
  if (typeof window === 'undefined' && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    return <GlobalLoadingSkeleton />;
  }

  return <>{children}</>;
}


export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []); 

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      <AuthHandler>
        {children}
      </AuthHandler>
    </FirebaseProvider>
  );
}
