import { getFullQueue } from '@/lib/actions';
import { AdminQueue } from '@/components/admin/AdminQueue';
import { Header } from '@/components/Header';
import { AdminNowPlaying } from '@/components/admin/AdminNowPlaying';
import { QRCodePlaceholder } from '@/components/admin/QRCodePlaceholder';
import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function AdminLoadingSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-96 w-full" />
      </div>
      <div className="space-y-8">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header isAdmin />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="font-headline text-4xl mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          KJ Dashboard
        </h1>
        <Suspense fallback={<AdminLoadingSkeleton/>}>
          <AdminView />
        </Suspense>
      </main>
    </div>
  );
}

async function AdminView() {
    const fullQueue = await getFullQueue();
    const nowPlaying = fullQueue.find((s) => s.status === 'playing') || null;
    const upcoming = fullQueue.filter((s) => s.status === 'queued');

    return (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <AdminQueue upcomingSongs={upcoming} />
          </div>
          <div className="space-y-8">
            <AdminNowPlaying nowPlaying={nowPlaying} />
            <QRCodePlaceholder />
          </div>
        </div>
    );
}