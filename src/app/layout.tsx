import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Sing A Long Karaoke',
  description: 'Real-time karaoke song requests and queue management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bgImage = PlaceHolderImages.find(p => p.id === 'karaoke-background');
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=Belleza&display=swap"
          rel="stylesheet"
        />
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
          <div className="flex-1">{children}</div>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
