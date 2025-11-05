'use client';

import { useTransition } from 'react';
import type { Song } from '@/lib/types';
import { removeSong, setNowPlaying } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

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
import { Play, Trash2, ListMusic, User, Music } from 'lucide-react';
import { EmptyQueue } from '../EmptyQueue';

type AdminQueueProps = {
  upcomingSongs: Song[];
};

export function AdminQueue({ upcomingSongs }: AdminQueueProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handlePlayNext = (song: Song) => {
    startTransition(async () => {
      await setNowPlaying(song.id);
      toast({
        title: 'Now Playing!',
        description: `"${song.title}" by ${song.artist} is up next.`,
      });
    });
  };

  const handleRemove = (song: Song) => {
    startTransition(async () => {
      await removeSong(song.id);
      toast({
        variant: 'destructive',
        title: 'Song Removed',
        description: `"${song.title}" has been removed from the queue.`,
      });
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
                <TableHead><User className="h-4 w-4 inline-block mr-1"/>Singer</TableHead>
                <TableHead><Music className="h-4 w-4 inline-block mr-1"/>Song</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingSongs.map((song, index) => (
                <TableRow key={song.id} className="group">
                  <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>{song.singer}</TableCell>
                  <TableCell>
                    <div className="font-medium">{song.title}</div>
                    <div className="text-sm text-muted-foreground">{song.artist}</div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
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
