'use client';

import { useState } from 'react';
import { getLyrics } from '@/ai/flows/get-lyrics-flow';
import { GroupedSong } from '@/lib/types';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { BookOpen } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Skeleton } from './ui/skeleton';

export function LyricsDialog({ song }: { song: GroupedSong }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = async (open: boolean) => {
    setIsOpen(open);
    if (open && !lyrics) {
      setIsLoading(true);
      setError('');
      try {
        const result = await getLyrics({ title: song.title, artist: song.artist });
        setLyrics(result.lyrics);
      } catch (e) {
        setError('Could not fetch lyrics. Please try again later.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <BookOpen className="mr-2 h-4 w-4" />
          View Lyrics
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Lyrics
          </DialogTitle>
          <DialogDescription>
            {song.title} by {song.artist}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-6">
          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[75%]" />
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[75%]" />
            </div>
          )}
          {error && <p className="text-destructive">{error}</p>}
          {lyrics && <p className="whitespace-pre-wrap text-foreground/90">{lyrics}</p>}
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
