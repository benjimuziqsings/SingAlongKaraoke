'use client';
import type { Song } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ListMusic, User, MessageSquare } from 'lucide-react';
import { EmptyQueue } from './EmptyQueue';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type SongQueueProps = {
  songs: Song[];
};

export function SongQueue({ songs }: SongQueueProps) {
  return (
    <section aria-labelledby="queue-title">
      <h2 id="queue-title" className="font-headline text-3xl my-6 flex items-center gap-3">
        <ListMusic className="text-primary h-7 w-7" />
        Up Next
      </h2>
      {songs.length > 0 ? (
        <ul className="space-y-4">
          {songs.map((song, index) => (
            <li key={song.id} className="animate-in fade-in-0 duration-500">
              <Card className="transition-all duration-300 hover:border-primary/50 hover:bg-card/90">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="text-2xl font-bold text-primary w-10 text-center">{index + 1}</div>
                  <div className="flex-grow">
                    <p className="font-bold text-lg">{song.title}</p>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pr-2">
                    <User className="h-4 w-4" />
                    <span>{song.singer}</span>
                     {song.announcement && (
                      <Popover>
                        <PopoverTrigger>
                          <MessageSquare className="h-4 w-4 text-accent/80 cursor-pointer hover:text-accent" />
                        </PopoverTrigger>
                        <PopoverContent>
                          <p className="text-sm italic">"{song.announcement}"</p>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyQueue />
      )}
    </section>
  );
}
