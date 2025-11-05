
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Artist, CatalogSong } from '@/lib/karaoke-catalog';
import { addArtist, addSongToCatalog, updateLyrics, removeArtistFromCatalog, removeSongFromCatalog, toggleArtistAvailability, toggleSongAvailability } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Music, BookText, Save, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';


const artistSchema = z.object({
  name: z.string().min(1, 'Artist name is required'),
});

const songSchema = z.object({
  artistId: z.string(),
  title: z.string().min(1, 'Song title is required'),
});

const lyricsSchema = z.object({
  artistId: z.string(),
  songId: z.string(),
  title: z.string(),
  lyrics: z.string().min(1, 'Lyrics are required'),
});

type CatalogManagementProps = {
  artists: Artist[];
};

export function CatalogManagement({ artists: initialArtists }: CatalogManagementProps) {
  const { toast } = useToast();
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [isArtistDialogOpen, setIsArtistDialogOpen] = useState(false);
  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
  const [isLyricsDialogOpen, setIsLyricsDialogOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedSong, setSelectedSong] = useState<CatalogSong | null>(null);
  const [isPending, startTransition] = useTransition();

  const artistForm = useForm<z.infer<typeof artistSchema>>({
    resolver: zodResolver(artistSchema),
    defaultValues: { name: '' },
  });

  const songForm = useForm<z.infer<typeof songSchema>>({
    resolver: zodResolver(songSchema),
    defaultValues: { artistId: '', title: '' },
  });
  
  const lyricsForm = useForm<z.infer<typeof lyricsSchema>>({
    resolver: zodResolver(lyricsSchema),
    defaultValues: { artistId: '', songId: '', title: '', lyrics: '' },
  });

  const onFormSubmit = async (action: (formData: FormData) => Promise<any>, formData: FormData, successMessage: string, optimisticUpdate: () => void) => {
    startTransition(async () => {
      const result = await action(formData);
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        toast({ title: 'Success', description: successMessage });
        optimisticUpdate();
      }
    });
  };

  const handleAddArtist = async (values: z.infer<typeof artistSchema>) => {
    const formData = new FormData();
    formData.append('name', values.name);
    // Note: We can't know the ID until it's created, so optimistic update is tricky.
    // A full re-fetch or more complex state management would be needed.
    // For now, we rely on revalidation which might have a slight delay.
    const result = await addArtist(formData);
     if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: `"${values.name}" has been added.` });
      // Manual refetch might be needed here, or rely on server revalidation
    }
    artistForm.reset();
    setIsArtistDialogOpen(false);
  };

  const handleAddSong = async (values: z.infer<typeof songSchema>) => {
    const formData = new FormData();
    formData.append('artistId', values.artistId);
    formData.append('title', values.title);
    const result = await addSongToCatalog(formData);
     if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: `"${values.title}" added for ${selectedArtist?.name}.` });
    }
    songForm.reset();
    setIsSongDialogOpen(false);
  };

  const handleUpdateLyrics = async (values: z.infer<typeof lyricsSchema>) => {
    const formData = new FormData();
    formData.append('artistId', values.artistId);
    formData.append('songId', values.songId);
    formData.append('lyrics', values.lyrics);
    const result = await updateLyrics(formData);
     if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: `Lyrics for "${values.title}" updated.` });
    }
    lyricsForm.reset();
    setIsLyricsDialogOpen(false);
  };
  
  const handleRemoveArtist = async (artistId: string, artistName: string) => {
    const formData = new FormData();
    formData.append('artistId', artistId);
    const result = await removeArtistFromCatalog(formData);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: `"${artistName}" has been removed.` });
    }
  };

  const handleRemoveSong = async (artistId: string, songId: string, songTitle: string) => {
    const formData = new FormData();
    formData.append('artistId', artistId);
    formData.append('songId', songId);
    const result = await removeSongFromCatalog(formData);
     if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: `"${songTitle}" has been removed.` });
    }
  };

  const handleToggleArtistAvailability = async (artist: Artist) => {
    const formData = new FormData();
    formData.append('artistId', artist.id!);
    formData.append('isAvailable', String(artist.isAvailable));
    const successMessage = `"${artist.name}" is now ${artist.isAvailable ? 'unavailable' : 'available'}.`;
    const result = await toggleArtistAvailability(formData);
     if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: successMessage });
    }
  };

  const handleToggleSongAvailability = async (artist: Artist, song: CatalogSong) => {
    const formData = new FormData();
    formData.append('artistId', artist.id!);
    formData.append('songId', song.id!);
    formData.append('isAvailable', String(song.isAvailable));
    const successMessage = `"${song.title}" is now ${song.isAvailable ? 'unavailable' : 'available'}.`;
    const result = await toggleSongAvailability(formData);
     if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: successMessage });
    }
  };


  const openSongDialog = (artist: Artist) => {
    setSelectedArtist(artist);
    songForm.setValue('artistId', artist.id!);
    setIsSongDialogOpen(true);
  };
  
  const openLyricsDialog = (artist: Artist, song: CatalogSong) => {
    setSelectedArtist(artist);
    setSelectedSong(song);
    lyricsForm.setValue('artistId', artist.id!);
    lyricsForm.setValue('songId', song.id!);
    lyricsForm.setValue('title', song.title);
    lyricsForm.setValue('lyrics', song.lyrics || '');
    setIsLyricsDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-headline text-2xl flex items-center gap-3">
          <BookText />
          Manage Catalog
        </CardTitle>
        <Dialog open={isArtistDialogOpen} onOpenChange={setIsArtistDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" /> Add Artist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Artist</DialogTitle>
            </DialogHeader>
            <Form {...artistForm}>
              <form onSubmit={artistForm.handleSubmit(handleAddArtist)} className="space-y-4">
                <FormField control={artistForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Name</FormLabel>
                    <FormControl><Input placeholder="e.g., The Rockers" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isPending}>{isPending ? "Adding..." : "Add Artist"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {artists.map((artist) => (
            <AccordionItem value={artist.id!} key={artist.id}>
              <div className="flex items-center group">
                 <AccordionTrigger className="font-bold text-lg flex-grow">{artist.name}</AccordionTrigger>
                 <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={() => handleToggleArtistAvailability(artist)} disabled={isPending}>
                        {artist.isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span className="sr-only">Toggle Artist Availability</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={isPending}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remove Artist</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove "{artist.name}" and all their songs from the catalog. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveArtist(artist.id!, artist.name)}>Remove</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 </div>
              </div>
              <AccordionContent>
                <div className="space-y-2 pl-4">
                  {artist.songs.map((song) => (
                    <div key={song.id} className={cn("flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group", !song.isAvailable && "opacity-50")}>
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-primary" />
                        <span>{song.title}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openLyricsDialog(artist, song)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Lyrics</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-accent" onClick={() => handleToggleSongAvailability(artist, song)} disabled={isPending}>
                            {song.isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            <span className="sr-only">Toggle Song Availability</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={isPending}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove Song</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove "{song.title}" from the catalog.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemoveSong(artist.id!, song.id!, song.title)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {artist.songs.length === 0 && (
                    <p className="text-sm text-muted-foreground p-2">No songs for this artist yet.</p>
                  )}
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => openSongDialog(artist)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Song
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Dialog open={isSongDialogOpen} onOpenChange={setIsSongDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Song for {selectedArtist?.name}</DialogTitle></DialogHeader>
            <Form {...songForm}>
              <form onSubmit={songForm.handleSubmit(handleAddSong)} className="space-y-4">
                <FormField control={songForm.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Song Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Rock Anthem" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isPending}>{isPending ? "Adding..." : "Add Song"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isLyricsDialogOpen} onOpenChange={setIsLyricsDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader><DialogTitle>Edit Lyrics for "{selectedSong?.title}"</DialogTitle></DialogHeader>
            <Form {...lyricsForm}>
              <form onSubmit={lyricsForm.handleSubmit(handleUpdateLyrics)} className="space-y-4">
                <FormField control={lyricsForm.control} name="lyrics" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lyrics</FormLabel>
                    <FormControl><Textarea placeholder="Enter song lyrics here..." {...field} rows={15} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isPending}><Save className="mr-2 h-4 w-4"/>{isPending ? "Saving..." : "Save Lyrics"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
}
