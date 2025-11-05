
'use client';

import { Header } from '@/components/Header';
import { NowPlaying } from '@/components/NowPlaying';
import { SongQueue } from '@/components/SongQueue';
import { SongRequestDialog } from '@/components/SongRequestDialog';
import { TippingDialog } from '@/components/TippingDialog';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ReviewDialog } from '@/components/ReviewDialog';
import { type GroupedSong } from '@/lib/types';


function QueueLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}


export default function Home() {
  // Data will be fetched via hooks in a later step
  const nowPlaying: GroupedSong | null = null;
  const queue: GroupedSong[] = [];
  const history: GroupedSong[] = [];

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <Suspense fallback={<QueueLoadingSkeleton />}>
           <div className="space-y-8">
            <NowPlaying song={nowPlaying} />
            <SongQueue songs={queue} title="Up Next" />
            {history.length > 0 && (
              <>
                <Separator className="my-12" />
                <SongQueue songs={history} title="Song History" isHistory />
              </>
            )}
          </div>
        </Suspense>
      </main>
      <footer className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border p-4 z-10">
        <div className="container mx-auto max-w-3xl grid grid-cols-2 lg:grid-cols-3 gap-4">
          <SongRequestDialog />
          <ReviewDialog />
          <TippingDialog />
        </div>
      </footer>
    </div>
  );
}
