
'use client';

import { AdminQueue } from '@/components/admin/AdminQueue';
import { Header } from '@/components/Header';
import { AdminNowPlaying } from '@/components/admin/AdminNowPlaying';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CatalogManagement } from '@/components/admin/CatalogManagement';
import { UserManagement } from '@/components/admin/UserManagement';
import { RequestSettings } from '@/components/admin/RequestSettings';

function AdminLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}

export default function AdminPage() {
  return (
    <div className="flex flex-col flex-1 bg-transparent">
      <Header isAdmin />
      <div className="flex-grow container mx-auto px-4 py-8">
        <h1 className="font-headline text-4xl mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          KJ Dashboard
        </h1>
        <Suspense fallback={<AdminLoadingSkeleton/>}>
          <Tabs defaultValue="queue" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="queue">Queue Management</TabsTrigger>
              <TabsTrigger value="catalog">Catalog Management</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            <TabsContent value="queue">
                <div className="space-y-8">
                  <RequestSettings />
                  <AdminNowPlaying />
                  <AdminQueue />
                </div>
            </TabsContent>
            <TabsContent value="catalog">
              <CatalogManagement />
            </TabsContent>
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          </Tabs>
        </Suspense>
      </div>
    </div>
  );
}
