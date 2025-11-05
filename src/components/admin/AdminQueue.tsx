
'use client';

import { useTransition } from 'react';
import type { GroupedSong } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
import { Play, Trash2, ListMusic, Users, Music, Lock, Unlock, MessageSquare, ArrowUp, ArrowDown } from 'lucide-react';
import { EmptyQueue } from '../EmptyQueue';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';


type AdminQueueProps = {
  upcomingSongs: GroupedSong[];
};

export function AdminQueue({ upcomingSongs }: AdminQueueProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();

  const handlePlayNext = (song: GroupedSong) => {
    startTransition(async () => {
        const batch = writeBatch(firestore);
        
        // 1. Find the current 'playing' song and set it to 'finished'
        const playingQuery = query(collection(firestore, 'song_requests'), where('status', '==', 'playing'));
        const playingSnapshot = await getDocs(playingQuery);
        playingSnapshot.forEach(doc => {
            batch.update(doc.ref, { status: 'finished' });
        });

        // 2. Set the new song to 'playing'
        const songRef = doc(firestore, 'song_requests', song.id);
        batch.update(songRef, { status: 'playing' });

        await batch.commit().catch(error => {
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
              path: song.id,
              operation: 'write',
            })
          )
        });

        toast({
            title: 'Now Playing!',
            description: `"${song.title}" by ${song.artist} is up next.`,
        });
    });
  };

  const handleRemove = (song: GroupedSong) => {
    startTransition(() => {
      const songRef = doc(firestore, 'song_requests', song.id);
      updateDocumentNonBlocking(songRef, { status: 'removed' });
      toast({
        variant: 'destructive',
        title: 'Song Removed',
        description: `"${song.title}" has been removed from the queue.`,
      });
    });
  };

  const handleToggleLock = (song: GroupedSong) => {
    startTransition(() => {
      const songRef = doc(firestore, 'song_requests', song.id);
      updateDocumentNonBlocking(songRef, { isLocked: !song.isLocked });
      toast({
        title: `Song ${song.isLocked ? 'Unlocked' : 'Locked'}`,
        description: `"${song.title}" has been ${song.isLocked ? 'unlocked' : 'locked'}.`,
      });
    });
  };
  
  const handleMove = async (songId: string, direction: 'up' | 'down') => {
    const currentIndex = upcomingSongs.findIndex(s => s.id === songId);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === upcomingSongs.length - 1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    const currentSong = upcomingSongs[currentIndex];
    const swapSong = upcomingSongs[swapIndex];

    if(!currentSong.sortOrder || !swapSong.sortOrder) return;

    const batch = writeBatch(firestore);
    const currentSongRef = doc(firestore, 'song_requests', currentSong.id);
    const swapSongRef = doc(firestore, 'song_requests', swapSong.id);
    
    batch.update(currentSongRef, { sortOrder: swapSong.sortOrder });
    batch.update(swapSongRef, { sortOrder: currentSong.sortOrder });

    await batch.commit();
  }

  const handleMoveUp = (song: GroupedSong) => {
    startTransition(() => {
      handleMove(song.id, 'up');
    });
  };

  const handleMoveDown = (song: GroupedSong) => {
    startTransition(() => {
      handleMove(song.id, 'down');
    });
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-3">
          <ListMusic />
          Song Queue
        </CardTitle>
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
                <TableRow key={song.id} className={cn("group", song.isLocked && "bg-muted/30")}>
                  <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {song.isLocked && <Lock className="h-4 w-4 text-accent" />}
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
                      onClick={() => handleMoveUp(song)}
                      disabled={isPending || index === 0}
                      aria-label="Move Up"
                    >
                      <ArrowUp className="h-5 w-5" />
                    </Button>
                     <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => handleMoveDown(song)}
                      disabled={isPending || index === upcomingSongs.length - 1}
                      aria-label="Move Down"
                    >
                      <ArrowDown className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-primary"
                      onClick={() => handlePlayNext(song)}
                      disabled={isPending}
                      aria-label="Play next"
                    >
                      <Play className="h-5 w-5" />
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
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn("text-muted-foreground hover:text-accent", song.isLocked && "text-accent")}
                        onClick={() => handleToggleLock(song)}
                        disabled={isPending}
                        aria-label={song.isLocked ? 'Unlock song' : 'Lock song'}
                    >
                        {song.isLocked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
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
  );
}
