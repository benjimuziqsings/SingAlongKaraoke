import { getNowPlaying, getQueue } from '@/lib/actions';
import { Header } from '@/components/Header';
import { NowPlaying } from '@/components/NowPlaying';
import { SongQueue } from '@/components/SongQueue';
import { SongRequestDialog } from '@/components/SongRequestDialog';
import { TippingDialog } from '@/components/TippingDialog';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-3xl">
        <Suspense fallback={<QueueLoadingSkeleton />}>
          <PatronView />
        </Suspense>
      </main>
      <footer className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t border-border p-4 z-10">
        <div className="container mx-auto max-w-3xl flex justify-center gap-4">
          <SongRequestDialog />
          <TippingDialog />
        </div>
      </footer>
    </div>
  );
}

async function PatronView() {
  const nowPlaying = await getNowPlaying();
  const queue = await getQueue();

  return (
    <div className="space-y-8">
      <NowPlaying song={nowPlaying} />
      <SongQueue songs={queue} />
    </div>
  )
}
