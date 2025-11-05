'use client';

import { useTransition } from 'react';
import type { GroupedSong } from '@/lib/types';
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
import { Play, Trash2, ListMusic, Users, Music, MessageSquare } from 'lucide-react';
import { EmptyQueue } from '../EmptyQueue';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type AdminQueueProps = {
  upcomingSongs: GroupedSong[];
};

export function AdminQueue({ upcomingSongs }: AdminQueueProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handlePlayNext = (song: GroupedSong) => {
    startTransition(async () => {
      await setNowPlaying(song.id);
      toast({
        title: 'Now Playing!',
        description: `"${song.title}" by ${song.artist} is up next.`,
      });
    });
  };

  const handleRemove = (song: GroupedSong) => {
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
                <TableHead><Music className="h-4 w-4 inline-block mr-1"/>Song</TableHead>
                <TableHead><Users className="h-4 w-4 inline-block mr-1"/>Requesters</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingSongs.map((song, index) => (
                <TableRow key={song.id} className="group">
                  <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium">{song.title}</div>
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
                          <ul className="space-y-2 text-sm">
                            {song.requesters.map((r, i) => (
                              <li key={i}>
                                <p className="font-semibold">{r.singer}</p>
                                {r.announcement && <p className="text-xs italic text-muted-foreground">"{r.announcement}"</p>}
                              </li>
                            ))}
                          </ul>
                        </PopoverContent>
                      </Popover>
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
