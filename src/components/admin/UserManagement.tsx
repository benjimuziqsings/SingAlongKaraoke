'use client';

import { usePatrons } from '@/hooks/usePatrons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, MessageCircle, Users, Phone, Edit, Trash2, Loader2 } from 'lucide-react';
import { BlastDialog } from './BlastDialog';
import { useMemo, useState, useTransition } from 'react';
import { Patron } from '@/lib/types';
import { Button } from '../ui/button';
import { EditUserDialog } from './EditUserDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, writeBatch } from 'firebase/firestore';

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
  const { patrons, isLoading, refetch: refetchPatrons } = usePatrons();
  const [selectedPatron, setSelectedPatron] = useState<Patron | null>(null);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isClearing, startClearingTransition] = useTransition();
  const firestore = useFirestore();
  const { toast } = useToast();

  const emailablePatrons = useMemo(() => patrons.filter(p => p.email), [patrons]);
  const textablePatrons = useMemo(() => patrons.filter(p => p.telephone), [patrons]);

  const handleEditClick = (patron: Patron) => {
    setSelectedPatron(patron);
    setIsEditUserDialogOpen(true);
  };
  
  const handleClearReviews = () => {
    startClearingTransition(async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
            return;
        }

        const reviewsQuery = query(collection(firestore, 'reviews'));
        try {
            const querySnapshot = await getDocs(reviewsQuery);
            if (querySnapshot.empty) {
                toast({ title: 'No Reviews', description: 'There are no reviews to clear.' });
                return;
            }

            const batch = writeBatch(firestore);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            toast({ title: 'Success', description: 'All reviews have been cleared.' });
        } catch (error: any) {
            console.error('Error clearing reviews:', error);
             const permissionError = new FirestorePermissionError({
                path: 'reviews',
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    });
  };


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
    <>
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-headline text-2xl flex items-center gap-3">
          <Users />
          Registered Patrons ({patrons.length})
        </CardTitle>
        <div className="flex items-center gap-2">
           <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isClearing}>
                    {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Clear All Reviews
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete all reviews from the database. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearReviews} disabled={isClearing}>
                    Yes, clear reviews
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          <BlastDialog
            patrons={emailablePatrons}
            type="email"
            triggerButton={
              <Button>
                <Mail /> Email Blast
              </Button>
            }
          />
          <BlastDialog
            patrons={textablePatrons}
            type="sms"
            triggerButton={
               <Button variant="secondary">
                <MessageCircle /> SMS Blast
              </Button>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patrons.map(patron => (
                <TableRow key={patron.id}>
                  <TableCell className="font-medium">{patron.displayName}</TableCell>
                  <TableCell>{patron.email || 'N/A'}</TableCell>
                  <TableCell>{patron.telephone || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(patron)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit User</span>
                    </Button>
                  </TableCell>
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

    {selectedPatron && (
      <EditUserDialog 
        patron={selectedPatron}
        isOpen={isEditUserDialogOpen}
        setIsOpen={setIsEditUserDialogOpen}
      />
    )}
    </>
  );
}
