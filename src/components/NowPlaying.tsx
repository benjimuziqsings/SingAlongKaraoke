'use client';
import type { GroupedSong } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Mic2, Music, User, MessageSquare, Users, BookOpen } from 'lucide-react';
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
  const hasAnnouncements = song?.requesters.some(r => r.announcement);

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
                       <p className="text-lg text-foreground flex items-center gap-2 cursor-pointer">
                        <Users className="h-5 w-5" />
                        Requested by <span className="font-bold text-accent">{song.requesters.length} singer{song.requesters.length > 1 ? 's' : ''}</span>
                      </p>
                    </PopoverTrigger>
                    <PopoverContent>
                       <h4 className="font-bold mb-2">Requesters</h4>
                      <ul className="space-y-1 text-sm">
                        {song.requesters.map((requester, idx) => (
                           <li key={idx} className="flex items-center justify-between">
                            <span>{requester.singer}</span>
                            {requester.announcement && <MessageSquare className="h-4 w-4 text-accent/80" />}
                           </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>

                {hasAnnouncements && (
                  <Popover>
                    <PopoverTrigger>
                      <div className="flex items-center gap-1 text-accent/80 cursor-pointer hover:text-accent">
                        <MessageSquare className="h-5 w-5" />
                        <span className="text-sm">Notes</span>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent>
                       <h4 className="font-bold mb-2">Special Announcements</h4>
                       <ul className="space-y-2">
                        {song.requesters.filter(r => r.announcement).map((requester, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="font-semibold">{requester.singer}:</span> "{requester.announcement}"
                          </li>
                        ))}
                      </ul>
                    </PopoverContent>
                  </Popover>
                )}
                <LyricsDialog song={song} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-lg">The stage is quiet for now...</p>
              <p>The next singer will be up shortly!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
