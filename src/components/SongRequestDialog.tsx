
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useCatalog } from '@/hooks/useCatalog';
import { cn } from '@/lib/utils';
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
import { DollarSign, Music, PlusCircle, Check, ChevronsUpDown, DoorClosed } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
    tip: z.coerce.number().min(0).optional(),
});

export function SongRequestDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const { artists: allArtists, isLoading: isCatalogLoading } = useCatalog();
  const { user } = useUser();
  const firestore = useFirestore();
  const [artistPopoverOpen, setArtistPopoverOpen] = useState(false);
  const [songPopoverOpen, setSongPopoverOpen] = useState(false);
  
  const settingsDocRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'requests') : null, [firestore]);
  const { data: requestSettings, isLoading: isSettingsLoading } = useDoc<{ acceptingRequests: boolean }>(settingsDocRef);
  
  // Default to false (closed) until data is loaded. This is a safer default.
  const isAcceptingRequests = requestSettings?.acceptingRequests ?? false;

  const artists = useMemo(() => allArtists.filter(artist => artist.isAvailable && artist.songs && artist.songs.some(s => s.isAvailable)), [allArtists]);

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

  const songs = useMemo(() => {
    if (selectedArtist) {
      const artistData = artists.find(a => a.name === selectedArtist);
      return artistData?.songs?.filter(s => s.isAvailable) || [];
    }
    return [];
  }, [selectedArtist, artists]);


  useEffect(() => {
    if (selectedArtist) {
      catalogForm.resetField('title');
    }
  }, [selectedArtist, catalogForm]);

  useEffect(() => {
    if (isOpen && user?.displayName) {
        catalogForm.setValue('singer', user.displayName);
        suggestionForm.setValue('singer', user.displayName);
    }
  }, [user, isOpen, catalogForm, suggestionForm]);


  const handleSubmit = async (songData: any) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
      return;
    }

    // Definitive Check: Fetch the setting directly from Firestore on submit.
    const settingsRef = doc(firestore, 'settings', 'requests');
    const settingsSnap = await getDoc(settingsRef);
    const serverSideAcceptingRequests = settingsSnap.exists() ? settingsSnap.data().acceptingRequests : false;

    if (!serverSideAcceptingRequests) {
        toast({ 
            variant: 'destructive',
            title: 'Requests Currently Closed', 
            description: 'Sorry, we are not taking new song requests at this time.' 
        });
        return;
    }
    
    if (!user) {
        toast({ 
            title: 'Please Sign In', 
            description: 'You need to be signed in to make a request. Please sign in or create an account.' 
        });
        return;
    }

    const requestsCol = collection(firestore, 'song_requests');
    addDocumentNonBlocking(firestore, requestsCol, songData);

    toast({
        title: 'Request Sent!',
        description: `Your request for "${songData.songTitle}" is in the queue.`,
    });
    setIsOpen(false);
  };


  function onCatalogSubmit(values: z.infer<typeof songRequestSchema>) {
    handleSubmit({
        singer: values.singer,
        artistName: values.artist,
        songTitle: values.title,
        specialAnnouncement: values.announcement || '',
        requestTime: Date.now(),
        status: 'queued' as 'queued',
        patronId: user?.uid,
    });
    catalogForm.reset();
  }

  function onSuggestionSubmit(values: z.infer<typeof suggestionSchema>) {
    handleSubmit({
        singer: values.singer,
        artistName: values.artist,
        songTitle: values.title,
        specialAnnouncement: values.announcement || '',
        requestTime: Date.now(),
        status: 'queued' as 'queued',
        patronId: user?.uid,
        tip: values.tip,
    });
    suggestionForm.reset();
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

        {isSettingsLoading ? (
            <Skeleton className="h-20 w-full" />
        ) : !isAcceptingRequests && (
            <Alert variant="destructive" className="mt-4">
                <DoorClosed className="h-4 w-4" />
                <AlertTitle>Requests Are Currently Closed</AlertTitle>
                <AlertDescription>
                The KJ is not taking any new song requests at this time. Please check back later!
                </AlertDescription>
            </Alert>
        )}

        <Tabs defaultValue="catalog" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="catalog">From Catalog</TabsTrigger>
            <TabsTrigger value="suggestion">Suggest New</TabsTrigger>
          </TabsList>
          <TabsContent value="catalog">
            <fieldset disabled={!isAcceptingRequests || isSettingsLoading}>
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
                        <FormItem className="flex flex-col">
                        <FormLabel>Artist</FormLabel>
                        {isCatalogLoading ? <Skeleton className="h-10 w-full" /> : (
                            <Popover open={artistPopoverOpen} onOpenChange={setArtistPopoverOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value
                                    ? artists.find(
                                        (artist) => artist.name === field.value
                                        )?.name
                                    : "Select an artist"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                <CommandInput placeholder="Search artist..." />
                                <CommandList>
                                    <CommandEmpty>No artist found.</CommandEmpty>
                                    <CommandGroup>
                                    {artists.map((artist) => (
                                        <CommandItem
                                        value={artist.name}
                                        key={artist.id}
                                        onSelect={() => {
                                            catalogForm.setValue("artist", artist.name)
                                            setArtistPopoverOpen(false)
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            artist.name === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                        />
                                        {artist.name}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                                </Command>
                            </PopoverContent>
                            </Popover>
                        )}
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={catalogForm.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Song</FormLabel>
                        <Popover open={songPopoverOpen} onOpenChange={setSongPopoverOpen}>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                disabled={!selectedArtist}
                                className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value
                                    ? songs.find(
                                        (song) => song.title === field.value
                                    )?.title
                                    : "Select a song"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search song..." />
                                <CommandList>
                                <CommandEmpty>No song found.</CommandEmpty>
                                <CommandGroup>
                                    {songs.map((song) => (
                                    <CommandItem
                                        value={song.title}
                                        key={song.title}
                                        onSelect={() => {
                                        catalogForm.setValue("title", song.title)
                                        setSongPopoverOpen(false)
                                        }}
                                    >
                                        <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            song.title === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                        />
                                        {song.title}
                                    </CommandItem>
                                    ))}
                                </CommandGroup>
                                </CommandList>
                            </Command>
                            </PopoverContent>
                        </Popover>
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
                    <Button type="submit" disabled={catalogForm.formState.isSubmitting || !isAcceptingRequests || isSettingsLoading}>
                        {catalogForm.formState.isSubmitting ? 'Submitting...' : 'Add to Queue'}
                    </Button>
                    </DialogFooter>
                </form>
                </Form>
            </fieldset>
          </TabsContent>
          <TabsContent value="suggestion">
             <fieldset disabled={!isAcceptingRequests || isSettingsLoading}>
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
                        <FormLabel>Tip (optional)</FormLabel>
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
                    <Button type="submit" disabled={suggestionForm.formState.isSubmitting || !isAcceptingRequests || isSettingsLoading}>
                        {suggestionForm.formState.isSubmitting ? 'Submitting...' : 'Suggest Song'}
                    </Button>
                    </DialogFooter>
                </form>
                </Form>
             </fieldset>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

    