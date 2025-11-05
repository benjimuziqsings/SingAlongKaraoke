'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addSong } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { karaokeCatalog, Artist } from '@/lib/karaoke-catalog';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Music, PlusCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const songRequestSchema = z.object({
  artist: z.string({ required_error: 'Please select an artist.' }),
  title: z.string({ required_error: 'Please select a song.' }),
  singer: z.string().min(1, { message: 'Your name is required.' }),
  announcement: z.string().optional(),
});

export function SongRequestDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [artists] = useState<Artist[]>(karaokeCatalog);
  const [songs, setSongs] = useState<{ title: string }[]>([]);

  const form = useForm<z.infer<typeof songRequestSchema>>({
    resolver: zodResolver(songRequestSchema),
    defaultValues: {
      singer: '',
      announcement: '',
    },
  });

  const selectedArtist = form.watch('artist');

  useEffect(() => {
    if (selectedArtist) {
      const artistData = artists.find(a => a.name === selectedArtist);
      setSongs(artistData?.songs || []);
      form.resetField('title');
    } else {
      setSongs([]);
    }
  }, [selectedArtist, artists, form]);

  async function onSubmit(values: z.infer<typeof songRequestSchema>) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });

    const result = await addSong(formData);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else {
      toast({
        title: 'Request Sent!',
        description: `Your request for "${values.title}" is in the queue.`,
      });
      form.reset();
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="flex-1 text-lg font-bold bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-6 w-6" />
          Request a Song
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Make a Song Request
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to add your song to the queue.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an artist" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {artists.map(artist => (
                        <SelectItem key={artist.name} value={artist.name}>
                          {artist.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Song</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedArtist}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a song" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {songs.map(song => (
                        <SelectItem key={song.title} value={song.title}>
                          {song.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="singer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name (for the KJ)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John D." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="announcement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Announcement (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Happy birthday, Sarah!"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Add to Queue'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
