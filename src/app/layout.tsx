
'use client';

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FirebaseClientProvider, useUser, initiateAnonymousSignIn, useAuth } from '@/firebase';
import { useEffect } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bgImage = PlaceHolderImages.find(p => p.id === 'karaoke-background');
  
  // This component will handle the auth logic
  function AuthHandler({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();

    useEffect(() => {
      // If the user state is done loading and there is no user, sign in anonymously.
      if (!isUserLoading && !user) {
        initiateAnonymousSignIn(auth);
      }
    }, [isUserLoading, user, auth]);
    
    return <>{children}</>;
  }


  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=Belleza&display=swap"
          rel="stylesheet"
        />
        <title>Sing A Long Karaoke</title>
        <meta name="description" content="Real-time karaoke song requests and queue management." />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col')}>
        {bgImage && (
          <Image
            src={bgImage.imageUrl}
            alt={bgImage.description}
            fill
            className="object-cover -z-10 opacity-10"
            data-ai-hint={bgImage.imageHint}
          />
        )}
        <FirebaseClientProvider>
          <AuthHandler>
            <div className="flex-1">{children}</div>
          </AuthHandler>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
