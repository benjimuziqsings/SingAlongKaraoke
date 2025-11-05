'use client';

import { useTransition } from 'react';
import type { Song } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mic2, Music, User } from 'lucide-react';
import { finishSong } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

type AdminNowPlayingProps = {
  nowPlaying: Song | null;
};

export function AdminNowPlaying({ nowPlaying }: AdminNowPlayingProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleFinishSong = () => {
    if (!nowPlaying) return;
    startTransition(async () => {
      await finishSong(nowPlaying.id);
      toast({
        title: 'Song Finished',
        description: `"${nowPlaying.title}" has been marked as finished.`,
      });
    });
  };

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
          <div className="space-y-3">
            <div>
              <p className="font-bold text-xl">{nowPlaying.title}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Music className="h-4 w-4" />
                {nowPlaying.artist}
              </p>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              {nowPlaying.singer}
            </p>
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
