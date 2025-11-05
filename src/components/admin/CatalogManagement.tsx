
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Artist } from '@/lib/karaoke-catalog';
import { addArtist, addSongToCatalog, updateLyrics, removeArtistFromCatalog, removeSongFromCatalog } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Music, BookText, Save, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const artistSchema = z.object({
  name: z.string().min(1, 'Artist name is required'),
});

const songSchema = z.object({
  artistName: z.string(),
  title: z.string().min(1, 'Song title is required'),
});

const lyricsSchema = z.object({
  artistName: z.string(),
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
  const [selectedSong, setSelectedSong] = useState<{ title: string; lyrics?: string } | null>(null);

  const artistForm = useForm<z.infer<typeof artistSchema>>({
    resolver: zodResolver(artistSchema),
    defaultValues: { name: '' },
  });

  const songForm = useForm<z.infer<typeof songSchema>>({
    resolver: zodResolver(songSchema),
    defaultValues: { artistName: '', title: '' },
  });
  
  const lyricsForm = useForm<z.infer<typeof lyricsSchema>>({
    resolver: zodResolver(lyricsSchema),
    defaultValues: { artistName: '', title: '', lyrics: '' },
  });

  const onFormSubmit = async (action: (formData: FormData) => Promise<any>, formData: FormData, successMessage: string) => {
    const result = await action(formData);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: successMessage });
    }
  };

  const handleAddArtist = async (values: z.infer<typeof artistSchema>) => {
    const formData = new FormData();
    formData.append('name', values.name);
    await onFormSubmit(addArtist, formData, `"${values.name}" has been added.`);
    // Optimistic update
    setArtists(prev => [...prev, { name: values.name, songs: [] }].sort((a, b) => a.name.localeCompare(b.name)));
    artistForm.reset();
    setIsArtistDialogOpen(false);
  };

  const handleAddSong = async (values: z.infer<typeof songSchema>) => {
    const formData = new FormData();
    formData.append('artistName', values.artistName);
    formData.append('title', values.title);
    await onFormSubmit(addSongToCatalog, formData, `"${values.title}" added for ${values.artistName}.`);
    setArtists(prev => prev.map(a => a.name === values.artistName ? { ...a, songs: [...a.songs, { title: values.title }].sort((s1,s2) => s1.title.localeCompare(s2.title)) } : a));
    songForm.reset();
    setIsSongDialogOpen(false);
  };

  const handleUpdateLyrics = async (values: z.infer<typeof lyricsSchema>) => {
    const formData = new FormData();
    formData.append('artistName', values.artistName);
    formData.append('title', values.title);
    formData.append('lyrics', values.lyrics);
    await onFormSubmit(updateLyrics, formData, `Lyrics for "${values.title}" updated.`);
    setArtists(prev => prev.map(a => a.name === values.artistName ? { ...a, songs: a.songs.map(s => s.title === values.title ? { ...s, lyrics: values.lyrics } : s) } : a));
    lyricsForm.reset();
    setIsLyricsDialogOpen(false);
  };
  
  const handleRemoveArtist = async (artistName: string) => {
    const formData = new FormData();
    formData.append('artistName', artistName);
    await onFormSubmit(removeArtistFromCatalog, formData, `"${artistName}" has been removed.`);
    setArtists(prev => prev.filter(a => a.name !== artistName));
  };

  const handleRemoveSong = async (artistName: string, title: string) => {
    const formData = new FormData();
    formData.append('artistName', artistName);
    formData.append('title', title);
    await onFormSubmit(removeSongFromCatalog, formData, `"${title}" has been removed.`);
    setArtists(prev => prev.map(a => a.name === artistName ? { ...a, songs: a.songs.filter(s => s.title !== title) } : a));
  };


  const openSongDialog = (artist: Artist) => {
    setSelectedArtist(artist);
    songForm.setValue('artistName', artist.name);
    setIsSongDialogOpen(true);
  };
  
  const openLyricsDialog = (artist: Artist, song: { title: string; lyrics?: string }) => {
    setSelectedArtist(artist);
    setSelectedSong(song);
    lyricsForm.setValue('artistName', artist.name);
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
                  <Button type="submit">Add Artist</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {artists.map((artist) => (
            <AccordionItem value={artist.name} key={artist.name}>
              <div className="flex items-center group">
                 <AccordionTrigger className="font-bold text-lg flex-grow">{artist.name}</AccordionTrigger>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <AlertDialogAction onClick={() => handleRemoveArtist(artist.name)}>Remove</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </div>
              <AccordionContent>
                <div className="space-y-2 pl-4">
                  {artist.songs.map((song) => (
                    <div key={song.title} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-primary" />
                        <span>{song.title}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openLyricsDialog(artist, song)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Lyrics</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
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
                              <AlertDialogAction onClick={() => handleRemoveSong(artist.name, song.title)}>Remove</AlertDialogAction>
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
                  <Button type="submit">Add Song</Button>
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
                  <Button type="submit"><Save className="mr-2 h-4 w-4"/>Save Lyrics</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
}
