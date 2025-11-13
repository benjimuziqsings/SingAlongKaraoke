
'use client';

import { useTransition } from 'react';
import { GroupedSong } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mic2, Music, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from '@/components/ui/tooltip';
import { useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useQueue } from '@/hooks/useQueue';
import { Skeleton } from '../ui/skeleton';
import { LyricsDialog } from '../LyricsDialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


export function AdminNowPlaying() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { nowPlaying, isLoading } = useQueue();

  const handleFinishSong = () => {
    if (!nowPlaying) return;
    startTransition(() => {
      nowPlaying.requesters.forEach(requester => {
        if (!requester.originalId) return;
        const songRef = doc(firestore, 'song_requests', requester.originalId);
        updateDocumentNonBlocking(songRef, { status: 'finished' });
      });
      
      toast({
        title: 'Song Finished',
        description: `"${nowPlaying.title}" has been marked as finished.`,
      });
    });
  };

  const hasAnnouncements = nowPlaying?.requesters.some(r => r.announcement);

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />
  }

  return (
    <Card className="bg-primary/10 border-primary/50">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-3 text-accent">
          <Mic2 className="animate-pulse" />
          Now Playing
        </CardTitle>
      </CardHeader>
      <CardContent>
        {nowPlaying ? (
           <div className="flex flex-col items-center gap-4">
            <div className="flex w-full items-center gap-4">
              <Avatar className="h-20 w-20 shadow-lg">
                <AvatarImage src={nowPlaying.artistImageUrl} alt={nowPlaying.artist} />
                <AvatarFallback>
                  <Music className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow space-y-1">
                <p className="font-bold text-xl">{nowPlaying.title}</p>
                <p className="text-sm text-muted-foreground">{nowPlaying.artist}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-foreground">
                        <Users className="h-3 w-3" />
                        {nowPlaying.requesters.length} requester{nowPlaying.requesters.length > 1 ? 's' : ''}
                      </p>
                    </PopoverTrigger>
                    <PopoverContent>
                      <h4 className="font-bold mb-2">Requesters</h4>
                      <ul className="space-y-1 text-sm">
                        {nowPlaying.requesters.map((requester, idx) => (
                          <li key={idx} className="flex flex-col">
                            <span className="font-semibold">{requester.singer}</span>
                            {requester.announcement && (
                              <p className="text-xs italic text-muted-foreground pl-2 border-l-2 border-accent ml-1 mt-1">
                                "{requester.announcement}"
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                  {hasAnnouncements && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <MessageSquare className="h-3 w-3 text-accent/80 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <h4 className="font-bold mb-2">Announcements</h4>
                          <ul className="space-y-2">
                            {nowPlaying.requesters.filter(r => r.announcement).map((requester, idx) => (
                              <li key={idx} className="text-xs">
                                <span className="font-semibold">{requester.singer}:</span> "{requester.announcement}"
                              </li>
                            ))}
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <LyricsDialog song={nowPlaying} />
                </div>
              </div>
            </div>
            <Button
              className="w-full"
              variant="destructive"
              onClick={handleFinishSong}
              disabled={isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isPending ? 'Finishing...' : 'Finish Song'}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No song is currently playing.</p>
        )}
      </CardContent>
    </Card>
  );
}
