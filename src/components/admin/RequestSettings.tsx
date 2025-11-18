
'use client';

import { useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function RequestSettings() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'settings', 'requests');
  }, [firestore]);

  const { data: settings, isLoading } = useDoc<{ acceptingRequests: boolean }>(settingsRef);

  // Initialize the document if it doesn't exist.
  useEffect(() => {
    if (!isLoading && !settings && settingsRef) {
      setDoc(settingsRef, { acceptingRequests: false });
    }
  }, [isLoading, settings, settingsRef]);

  const handleToggle = (isToggled: boolean) => {
    if (!settingsRef || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Firestore not available.',
      });
      return;
    }
    setDocumentNonBlocking(firestore, settingsRef, { acceptingRequests: isToggled }, { merge: true });
    toast({
        title: 'Settings Updated',
        description: `Song requests are now ${isToggled ? 'OPEN' : 'CLOSED'}.`
    })
  };

  const isAcceptingRequests = settings?.acceptingRequests ?? false;

  return (
    <Card>
      <CardContent className="p-4">
        {isLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <div className="flex items-center justify-between">
            <Label htmlFor="request-toggle" className="text-lg font-medium">
              Accepting Song Requests
            </Label>
            <Switch
              id="request-toggle"
              checked={isAcceptingRequests}
              onCheckedChange={handleToggle}
              aria-label="Toggle song requests"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
