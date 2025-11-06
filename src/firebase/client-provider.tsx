
'use client';

import React, { useMemo, type ReactNode, useEffect } from 'react';
import { FirebaseProvider, useUser, useAuth } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

const AUTH_ROUTES = ['/'];
const PUBLIC_ROUTES = ['/']; // Or any other public routes

function AuthHandler({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Wait for user status to be confirmed

    const isAuthRoute = AUTH_ROUTES.includes(pathname);
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (user && isAuthRoute) {
      router.push('/home'); // Redirect logged-in users from auth pages to home
    } else if (!user && !isPublicRoute) {
      router.push('/'); // Redirect unauthenticated users from protected pages to login
    }
  }, [isUserLoading, user, pathname]);

  if (isUserLoading) {
    // You can return a global loading spinner here
    return <div>Loading...</div>;
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
    >
      <AuthHandler>
        {children}
      </AuthHandler>
    </FirebaseProvider>
  );
}
