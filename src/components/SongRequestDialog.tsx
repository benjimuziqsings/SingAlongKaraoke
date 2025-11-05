
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addSong, getLockedSongs } from '@/lib/actions';
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
import { DollarSign, Music, PlusCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const songRequestSchema = z.object({
  singer: z.string().min(1, { message: 'Your name is required.' }),
  artist: z.string({ required_error: 'Please select an artist.' }),
  title: z.string({ required_error: 'Please select a song.' }),
  announcement: z.string().optional(),
});

const suggestionSchema = z.object({
    singer: z.string().min(1, { message: 'Your name is required.' }),
    artist: z.string().min(1, { message: 'Artist name is required.' }),
    title: z.string().min(1, { message: 'Song title is required.' }),
    announcement: z.string().optional(),
    tip: z.coerce.number().min(5, { message: 'A minimum tip of $5 is required for suggestions.' }),
});

export function SongRequestDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songs, setSongs] = useState<{ title: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchAndFilter = async () => {
        const lockedSongs = await getLockedSongs();
        const availableArtists = karaokeCatalog.map(artist => {
            const availableSongs = artist.songs.filter(song => 
                !lockedSongs.some(locked => locked.title === song.title && locked.artist === artist.name)
            );
            return { ...artist, songs: availableSongs };
        }).filter(artist => artist.songs.length > 0);
        setArtists(availableArtists);
      };
      fetchAndFilter();
    }
  }, [isOpen]);

  const catalogForm = useForm<z.infer<typeof songRequestSchema>>({
    resolver: zodResolver(songRequestSchema),
    defaultValues: {
      singer: '',
      announcement: '',
    },
  });

  const suggestionForm = useForm<z.infer<typeof suggestionSchema>>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      singer: '',
      artist: '',
      title: '',
      announcement: '',
      tip: 5,
    },
  });


  const selectedArtist = catalogForm.watch('artist');

  useEffect(() => {
    if (selectedArtist) {
      const artistData = artists.find(a => a.name === selectedArtist);
      setSongs(artistData?.songs || []);
      catalogForm.resetField('title');
    } else {
      setSongs([]);
    }
  }, [selectedArtist, artists, catalogForm]);

  async function onCatalogSubmit(values: z.infer<typeof songRequestSchema>) {
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
      catalogForm.reset();
      setIsOpen(false);
    }
  }

  async function onSuggestionSubmit(values: z.infer<typeof suggestionSchema>) {
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        formData.append(key, String(value));
      }
    });
    // In a real app, you'd also handle the payment flow here.
    const result = await addSong(formData);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else {
      toast({
        title: 'Suggestion Sent!',
        description: `Your suggestion for "${values.title}" is in the queue with a $${values.tip} tip!`,
      });
      suggestionForm.reset();
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            Make a Song Request
          </DialogTitle>
          <DialogDescription>
            Choose from our catalog or suggest a new song.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="catalog" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="catalog">From Catalog</TabsTrigger>
            <TabsTrigger value="suggestion">Suggest New</TabsTrigger>
          </TabsList>
          <TabsContent value="catalog">
            <Form {...catalogForm}>
              <form onSubmit={catalogForm.handleSubmit(onCatalogSubmit)} className="space-y-4 pt-4">
                 <FormField
                  control={catalogForm.control}
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
                  control={catalogForm.control}
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
                  control={catalogForm.control}
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
                  control={catalogForm.control}
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
                  <Button type="submit" disabled={catalogForm.formState.isSubmitting}>
                    {catalogForm.formState.isSubmitting ? 'Submitting...' : 'Add to Queue'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="suggestion">
             <Form {...suggestionForm}>
              <form onSubmit={suggestionForm.handleSubmit(onSuggestionSubmit)} className="space-y-4 pt-4">
                 <FormField
                  control={suggestionForm.control}
                  name="singer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name (for the KJ)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Jane D." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={suggestionForm.control}
                  name="artist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artist</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., The Beatles" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={suggestionForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Song Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Hey Jude" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={suggestionForm.control}
                  name="announcement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Announcement (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., This one's for my friends!"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={suggestionForm.control}
                  name="tip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tip (min. $5 required)</FormLabel>
                       <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="number" placeholder="5.00" className="pl-8" {...field} />
                        </div>
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
                  <Button type="submit" disabled={suggestionForm.formState.isSubmitting} variant="destructive">
                    {suggestionForm.formState.isSubmitting ? 'Submitting...' : 'Suggest & Tip'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
