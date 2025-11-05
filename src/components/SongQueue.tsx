'use client';
import type { GroupedSong } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { ListMusic, Users, History, MessageSquare } from 'lucide-react';
import { EmptyQueue } from './EmptyQueue';
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
} from './ui/tooltip';
import { cn } from '@/lib/utils';

type SongQueueProps = {
  songs: GroupedSong[];
  title?: string;
  isHistory?: boolean;
};

export function SongQueue({ songs, title = "Up Next", isHistory = false }: SongQueueProps) {
  return (
    <section aria-labelledby="queue-title">
      <h2 id="queue-title" className="font-headline text-3xl my-6 flex items-center gap-3">
        {isHistory ? <History className="text-primary h-7 w-7" /> : <ListMusic className="text-primary h-7 w-7" />}
        {title}
      </h2>
      {songs.length > 0 ? (
        <ul className="space-y-4">
          {songs.map((song, index) => (
            <li key={song.id} className="animate-in fade-in-0 duration-500">
              <Card className={cn("transition-all duration-300", !isHistory && "hover:border-primary/50 hover:bg-card/90", isHistory && "opacity-60")}>
                <CardContent className="p-4 flex items-center gap-4">
                  {!isHistory && <div className="text-2xl font-bold text-primary w-10 text-center">{index + 1}</div>}
                  <div className="flex-grow">
                    <p className="font-bold text-lg">{song.title}</p>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pr-2 cursor-pointer">
                        <Users className="h-4 w-4" />
                        <span>{song.requesters.length} request{song.requesters.length > 1 ? 's' : ''}</span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto">
                       <h4 className="font-bold mb-2 text-sm">Requested By</h4>
                        <ul className="space-y-1">
                          {song.requesters.map((r, i) => (
                            <li key={i} className="text-xs flex items-center gap-2">
                              <span>{r.singer}</span>
                              {r.announcement && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <MessageSquare className="h-3 w-3 text-accent/80"/>
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
