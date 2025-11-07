
'use client';
import type { GroupedSong } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Mic2, Music, Users, MessageSquare } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from './ui/button';
import { LyricsDialog } from './LyricsDialog';

type NowPlayingProps = {
  song: GroupedSong | null;
};

export function NowPlaying({ song }: NowPlayingProps) {
  return (
    <section aria-labelledby="now-playing-title">
      <Card className="bg-primary/10 border-primary/50 shadow-lg shadow-primary/10 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Mic2 className="text-accent animate-pulse h-6 w-6" />
            <CardTitle id="now-playing-title" className="font-headline text-3xl text-accent">
              Now Playing
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {song ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-headline text-4xl md:text-5xl text-white break-words">{song.title}</h3>
                <p className="text-xl text-muted-foreground flex items-center gap-2 mt-1">
                  <Music className="h-5 w-5" />
                  {song.artist}
                </p>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                 <Popover>
                    <PopoverTrigger asChild>
                       <Button variant="outline">
                         <Users className="mr-2 h-4 w-4" />
                         View Requesters ({song.requesters.length})
                       </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                       <h4 className="font-bold mb-2">Requested By</h4>
                      <ul className="space-y-2 text-sm">
                        {song.requesters.map((requester, idx) => (
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
                <LyricsDialog song={song} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-lg">The stage is quiet for now...</p>
              <p>Get ready for the next song.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
