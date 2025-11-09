
'use client';

import { usePatrons } from '@/hooks/usePatrons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, MessageCircle, Users, Phone } from 'lucide-react';
import { BlastDialog } from './BlastDialog';
import { useMemo } from 'react';
import { Patron } from '@/lib/types';

function UserManagementLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserManagement() {
  const { patrons, isLoading } = usePatrons();

  const emailablePatrons = useMemo(() => patrons.filter(p => p.email), [patrons]);
  const textablePatrons = useMemo(() => patrons.filter(p => p.telephone), [patrons]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <UserManagementLoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-headline text-2xl flex items-center gap-3">
          <Users />
          Registered Patrons ({patrons.length})
        </CardTitle>
        <div className="flex items-center gap-2">
          <BlastDialog
            patrons={emailablePatrons}
            type="email"
            triggerButton={
              <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                <Mail /> Email Blast
              </button>
            }
          />
          <BlastDialog
            patrons={textablePatrons}
            type="sms"
            triggerButton={
               <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
                <MessageCircle /> SMS Blast
              </button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        {patrons.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead><Mail className="inline h-4 w-4 mr-1"/>Email</TableHead>
                <TableHead><Phone className="inline h-4 w-4 mr-1"/>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patrons.map(patron => (
                <TableRow key={patron.id}>
                  <TableCell className="font-medium">{patron.displayName}</TableCell>
                  <TableCell>{patron.email || 'N/A'}</TableCell>
                  <TableCell>{patron.telephone || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No patrons have registered yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
