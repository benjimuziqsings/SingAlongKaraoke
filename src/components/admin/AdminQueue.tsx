
'use client';

import { useTransition } from 'react';
import type { GroupedSong } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, writeBatch, getDocs, query, collection, where, updateDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Trash2, ListMusic, Users, Music, MessageSquare, Loader2, Lock, Unlock, ShieldQuestion } from 'lucide-react';
import { EmptyQueue } from '../EmptyQueue';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useQueue } from '@/hooks/useQueue';
import { Skeleton } from '../ui/skeleton';
import { Separator } from '../ui/separator';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function AdminQueue() {
  const [isPending, startTransition] = useTransition();
  const [isClearing, startClearingTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { upcoming: upcomingSongs, held: heldSongs, history, nowPlaying, isLoading, refetch } = useQueue();

  const handlePlayNext = (song: GroupedSong) => {
    startTransition(async () => {
      if (!firestore) return;

      try {
        const batch = writeBatch(firestore);

        // 1. If a song is currently playing, set its status to 'finished'.
        if (nowPlaying) {
          for (const requester of nowPlaying.requesters) {
            if (requester.originalId) {
              const oldSongRef = doc(firestore, 'song_requests', requester.originalId);
              batch.update(oldSongRef, { status: 'finished' });
            }
          }
        }

        // 2. Set the new song's status to 'playing'.
        for (const requester of song.requesters) {
          if (requester.originalId) {
            const newSongRef = doc(firestore, 'song_requests', requester.originalId);
            batch.update(newSongRef, { status: 'playing' });
          }
        }
        
        await batch.commit();

        toast({
          title: 'Now Playing!',
          description: `"${song.title}" by ${song.artist} is up next.`,
        });

      } catch (error) {
        // This will catch any permission errors from the individual updates.
        console.error("Error updating song statuses:", error);
        const permissionError = new FirestorePermissionError({
          path: `song_requests (batch operation)`,
          operation: 'update',
          requestResourceData: { status: 'playing/finished' }
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    });
  };

  const updateSongStatus = (song: GroupedSong, newStatus: 'removed' | 'held' | 'queued') => {
    startTransition(() => {
      if (!firestore) return;
      song.requesters.forEach(requester => {
        if (!requester.originalId) return;
        const songRef = doc(firestore, 'song_requests', requester.originalId);
        updateDocumentNonBlocking(songRef, { status: newStatus });
      });

      let toastTitle = 'Song Updated';
      let toastDescription = `"${song.title}" has been updated.`;

      switch (newStatus) {
        case 'removed':
          toastTitle = 'Song Removed';
          toastDescription = `"${song.title}" has been removed from the queue.`;
          break;
        case 'held':
          toastTitle = 'Song Held';
          toastDescription = `"${song.title}" has been moved to the held list.`;
          break;
        case 'queued':
          toastTitle = 'Song Unheld';
          toastDescription = `"${song.title}" has been moved back to the queue.`;
          break;
      }

      toast({
        variant: newStatus === 'removed' ? 'destructive' : 'default',
        title: toastTitle,
        description: toastDescription,
      });
    });
  }

  const handleRemove = (song: GroupedSong) => updateSongStatus(song, 'removed');
  const handleHold = (song: GroupedSong) => updateSongStatus(song, 'held');
  const handleUnhold = (song: GroupedSong) => updateSongStatus(song, 'queued');

  
  const handleClearList = (statusToClear: 'queued' | 'finished' | 'held') => {
    startClearingTransition(async () => {
      if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
        return;
      }
      
      const listNameMap = {
        'queued': 'queue',
        'finished': 'history',
        'held': 'held list'
      }
      const listName = listNameMap[statusToClear];
      const q = query(collection(firestore, 'song_requests'), where('status', '==', statusToClear));
      
      try {
        const querySnapshot = await getDocs(q);

        const batch = writeBatch(firestore);
        querySnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        
        await batch.commit();

        toast({ title: 'Success', description: `The ${listName} has been cleared.` });
        if (refetch) refetch();

      } catch (error: any) {
        if (error.code === 'permission-denied') {
            const operation = error.customData?.operation || (error.message.includes('get') ? 'list' : 'delete');
            const permissionError = new FirestorePermissionError({
                path: 'song_requests',
                operation: operation,
            });
            errorEmitter.emit('permission-error', permissionError);
        } else {
             console.error(`Error clearing ${listName}:`, error);
        }
      }
    });
  };


  if (isLoading) {
    return <Skeleton className="h-96 w-full" />
  }

  return (
    <>
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-headline text-2xl flex items-center gap-3">
          <ListMusic />
          Song Queue
        </CardTitle>
         <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={upcomingSongs.length === 0 || isClearing}>
                    {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Clear Queue
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently clear the entire upcoming song queue. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleClearList('queued')} disabled={isClearing}>
                    Yes, clear queue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={history.length === 0 || isClearing}>
                  {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently clear the entire song history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleClearList('finished')} disabled={isClearing}>
                    Yes, clear history
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingSongs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead><Music className="h-4 w-4 inline-block mr-1"/>Song</TableHead>
                <TableHead><Users className="h-4 w-4 inline-block mr-1"/>Requesters</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingSongs.map((song, index) => (
                <TableRow key={song.groupedId} className="group">
                  <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {song.title}
                    </div>
                    <div className="text-sm text-muted-foreground">{song.artist}</div>
                  </TableCell>
                  <TableCell>
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="ghost" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            {song.requesters.length}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <h4 className="font-bold mb-2">Requesters</h4>
                          <ul className="space-y-1 text-sm">
                            {song.requesters.map((r, i) => (
                              <li key={i} className="flex items-center justify-between">
                                <span>{r.singer}</span>
                                {r.announcement && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <MessageSquare className="h-4 w-4 text-accent/80"/>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs italic">"{r.announcement}"</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </li>
                            ))}
                          </ul>
                        </PopoverContent>
                      </Popover>
                  </TableCell>
                  <TableCell className="text-right space-x-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => handlePlayNext(song)}
                      disabled={isPending}
                      aria-label="Play next"
                    >
                      {isPending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-yellow-500"
                      onClick={() => handleHold(song)}
                      disabled={isPending}
                      aria-label="Hold song"
                    >
                      <Lock className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(song)}
                      disabled={isPending}
                       aria-label="Remove song"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyQueue isAdmin/>
        )}
      </CardContent>
    </Card>

    {heldSongs.length > 0 && (
      <>
      <Separator className="my-8"/>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="font-headline text-2xl flex items-center gap-3">
            <Lock />
            Held Songs
          </CardTitle>
          <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={isClearing}>
                    {isClearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Clear Held
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently clear all held songs. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleClearList('held')} disabled={isClearing}>
                    Yes, clear held
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Music className="h-4 w-4 inline-block mr-1"/>Song</TableHead>
                <TableHead><Users className="h-4 w-4 inline-block mr-1"/>Requesters</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {heldSongs.map((song) => (
                <TableRow key={song.groupedId} className="group opacity-70">
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {song.title}
                    </div>
                    <div className="text-sm text-muted-foreground">{song.artist}</div>
                  </TableCell>
                  <TableCell>
                     <Popover>
                        <PopoverTrigger asChild>
                           <Button variant="ghost" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            {song.requesters.length}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <h4 className="font-bold mb-2">Requesters</h4>
                          <ul className="space-y-1 text-sm">
                            {song.requesters.map((r, i) => (
                              <li key={i} className="flex items-center justify-between">
                                <span>{r.singer}</span>
                                {r.announcement && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <MessageSquare className="h-4 w-4 text-accent/80"/>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs italic">"{r.announcement}"</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </li>
                            ))}
                          </ul>
                        </PopoverContent>
                      </Popover>
                  </TableCell>
                  <TableCell className="text-right space-x-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-yellow-500"
                      onClick={() => handleUnhold(song)}
                      disabled={isPending}
                      aria-label="Unhold song"
                    >
                      <Unlock className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(song)}
                      disabled={isPending}
                       aria-label="Remove song"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </>
    )}
    </>
  );
}

    