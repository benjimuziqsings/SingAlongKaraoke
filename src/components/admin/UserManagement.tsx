
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { User, ShieldCheck } from 'lucide-react';

interface PatronProfile {
  id: string;
  displayName: string;
  email: string;
  // isKJ is determined by custom claims, not a document field.
}

export function UserManagement() {
  const firestore = useFirestore();

  const patronsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'patrons'));
  }, [firestore]);

  const { data: patrons, isLoading } = useCollection<PatronProfile>(patronsQuery);


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-3">
          <User />
          Registered Users
        </CardTitle>
      </CardHeader>
      <CardContent>
         <p className="text-sm text-muted-foreground mb-4">
            This table shows all registered users. KJ (admin) status is managed via Firebase custom claims and must be set by a project administrator on the backend.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">
                 Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patrons && patrons.map((patron) => (
              <TableRow key={patron.id}>
                <TableCell className="font-medium">{patron.displayName}</TableCell>
                <TableCell className="text-muted-foreground">{patron.email}</TableCell>
                <TableCell className="text-right">
                    {/* 
                      Displaying KJ status from a doc field is insecure and doesn't reflect actual permissions.
                      True KJ status is derived from a custom claim on the auth token, which is not available here.
                      This UI is now read-only.
                    */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
         {(!patrons || patrons.length === 0) && !isLoading && (
            <div className="text-center p-8 text-muted-foreground">
                No registered users found.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
