'use client';
import type { Song } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Mic2, Music, User, MessageSquare } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type NowPlayingProps = {
  song: Song | null;
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
              <div className="flex items-center gap-2">
                <p className="text-lg text-foreground flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Requested by <span className="font-bold text-accent">{song.singer}</span>
                </p>
                {song.announcement && (
                  <Popover>
                    <PopoverTrigger>
                      <MessageSquare className="h-5 w-5 text-accent/80 cursor-pointer hover:text-accent" />
                    </PopoverTrigger>
                    <PopoverContent>
                      <p className="text-sm italic">"{song.announcement}"</p>
                    </PopoverContent>
                  </Popover>
                )}
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
