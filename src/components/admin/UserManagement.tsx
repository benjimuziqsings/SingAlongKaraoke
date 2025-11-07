
'use client';

import { useState, useTransition } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Shield } from 'lucide-react';

interface PatronProfile {
  id: string;
  displayName: string;
  email: string;
  isKJ?: boolean;
}

export function UserManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const patronsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'patrons'));
  }, [firestore]);

  const { data: patrons, isLoading } = useCollection<PatronProfile>(patronsQuery);

  const handleKjToggle = (patron: PatronProfile) => {
    if (!firestore) return;
    startTransition(() => {
      const patronRef = doc(firestore, 'patrons', patron.id);
      const newKjStatus = !patron.isKJ;
      updateDocumentNonBlocking(patronRef, { isKJ: newKjStatus });
      toast({
        title: 'Permissions Updated',
        description: `${patron.displayName} is ${newKjStatus ? 'now' : 'no longer'} a KJ.`,
      });
    });
  };

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
          User Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Shield className="h-4 w-4" />
                  KJ Status
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patrons && patrons.map((patron) => (
              <TableRow key={patron.id}>
                <TableCell className="font-medium">{patron.displayName}</TableCell>
                <TableCell className="text-muted-foreground">{patron.email}</TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={patron.isKJ || false}
                    onCheckedChange={() => handleKjToggle(patron)}
                    disabled={isPending}
                    aria-label={`Toggle KJ status for ${patron.displayName}`}
                  />
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
