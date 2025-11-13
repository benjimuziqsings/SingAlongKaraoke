
'use client';

import { useState, useTransition, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Artist, CatalogSong } from '@/lib/karaoke-catalog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Music, BookText, Save, Edit, Trash2, Eye, EyeOff, Loader2, ListPlus, Download, Upload, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useFirestore, useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { collection, doc, writeBatch, getDocs, addDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useCatalog } from '@/hooks/useCatalog';


const artistSchema = z.object({
  name: z.string().min(1, 'Artist name is required'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

const editArtistSchema = artistSchema.extend({
  id: z.string(),
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

const addToQueueSchema = z.object({
  singer: z.string().min(1, "Singer's name is required."),
});


export function CatalogManagement() {
  const { artists, isLoading, refetch: refetchCatalog } = useCatalog();
  const { user } = useUser();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isArtistDialogOpen, setIsArtistDialogOpen] = useState(false);
  const [isEditArtistDialogOpen, setIsEditArtistDialogOpen] = useState(false);
  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
  const [isLyricsDialogOpen, setIsLyricsDialogOpen] = useState(false);
  const [isAddToQueueDialogOpen, setIsAddToQueueDialogOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedSong, setSelectedSong] = useState<CatalogSong | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isImporting, startImportTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);


  const artistForm = useForm<z.infer<typeof artistSchema>>({
    resolver: zodResolver(artistSchema),
    defaultValues: { name: '', imageUrl: '' },
  });

  const editArtistForm = useForm<z.infer<typeof editArtistSchema>>({
    resolver: zodResolver(editArtistSchema),
    defaultValues: { id: '', name: '', imageUrl: '' },
  });

  const songForm = useForm<z.infer<typeof songSchema>>({
    resolver: zodResolver(songSchema),
    defaultValues: { artistId: '', title: '' },
  });
  
  const lyricsForm = useForm<z.infer<typeof lyricsSchema>>({
    resolver: zodResolver(lyricsSchema),
    defaultValues: { artistId: '', songId: '', title: '', lyrics: '' },
  });

  const addToQueueForm = useForm<z.infer<typeof addToQueueSchema>>({
    resolver: zodResolver(addToQueueSchema),
    defaultValues: { singer: '' },
  });

  const handleAddArtist = async (values: z.infer<typeof artistSchema>) => {
    startTransition(() => {
      const artistsCol = collection(firestore, 'artists');
      addDocumentNonBlocking(artistsCol, {
        name: values.name,
        imageUrl: values.imageUrl || '',
        isAvailable: true,
      });
      toast({ title: 'Success', description: `"${values.name}" has been added.` });
      artistForm.reset();
      setIsArtistDialogOpen(false);
    });
  };

  const handleEditArtist = async (values: z.infer<typeof editArtistSchema>) => {
    startTransition(() => {
      const artistRef = doc(firestore, 'artists', values.id);
      updateDocumentNonBlocking(artistRef, {
        name: values.name,
        imageUrl: values.imageUrl || '',
      });
      toast({ title: 'Success', description: `"${values.name}" has been updated.` });
      editArtistForm.reset();
      setIsEditArtistDialogOpen(false);
    });
  };

  const handleAddSong = async (values: z.infer<typeof songSchema>) => {
    startTransition(() => {
      const songsCol = collection(firestore, 'artists', values.artistId, 'songs');
      addDocumentNonBlocking(songsCol, {
        title: values.title,
        isAvailable: true,
        lyrics: '',
      });
      toast({ title: 'Success', description: `"${values.title}" added for ${selectedArtist?.name}.` });
      songForm.reset();
      setIsSongDialogOpen(false);
    });
  };

  const handleUpdateLyrics = async (values: z.infer<typeof lyricsSchema>) => {
    startTransition(() => {
      const songRef = doc(firestore, 'artists', values.artistId, 'songs', values.songId);
      updateDocumentNonBlocking(songRef, { lyrics: values.lyrics });
      toast({ title: 'Success', description: `Lyrics for "${values.title}" updated.` });
      lyricsForm.reset();
      setIsLyricsDialogOpen(false);
    });
  };
  
  const handleRemoveArtist = (artistId: string, artistName: string) => {
    startTransition(async () => {
      if (!firestore) return;
      const artistRef = doc(firestore, 'artists', artistId);
      const songsColRef = collection(firestore, 'artists', artistId, 'songs');
      
      try {
        const songsSnapshot = await getDocs(songsColRef).catch((serverError) => {
          const permissionError = new FirestorePermissionError({
            path: songsColRef.path,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });

        const batch = writeBatch(firestore);
        songsSnapshot.forEach(songDoc => {
            batch.delete(songDoc.ref);
        });
        batch.delete(artistRef);
        
        await batch.commit();

        toast({ title: 'Success', description: `"${artistName}" and all associated songs have been removed.` });
      } catch (error) {
        if (error instanceof FirestorePermissionError) {
            // This error was already emitted, just prevent the success toast.
            console.error("Permission error during artist removal:", error.message);
        } else {
            // This is likely a permission error on the batch.commit() itself.
            const permissionError = new FirestorePermissionError({
              path: `artists/${artistId} and subcollections`,
              operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            console.error("Failed to remove artist:", error);
        }
      }
    });
  };

  const handleRemoveSong = (artistId: string, songId: string, songTitle: string) => {
    startTransition(() => {
      const songRef = doc(firestore, 'artists', artistId, 'songs', songId);
      deleteDocumentNonBlocking(songRef);
      toast({ title: 'Success', description: `"${songTitle}" has been removed.` });
    });
  };

  const handleToggleArtistAvailability = (artist: Artist) => {
    startTransition(() => {
      if (!artist.id) return;
      const artistRef = doc(firestore, 'artists', artist.id);
      updateDocumentNonBlocking(artistRef, { isAvailable: !artist.isAvailable });
      toast({ title: 'Success', description: `"${artist.name}" is now ${artist.isAvailable ? 'unavailable' : 'available'}.` });
    });
  };

  const handleToggleSongAvailability = (artist: Artist, song: CatalogSong) => {
    startTransition(() => {
      if (!artist.id || !song.id) return;
      const songRef = doc(firestore, 'artists', artist.id, 'songs', song.id);
      updateDocumentNonBlocking(songRef, { isAvailable: !song.isAvailable });
      toast({ title: 'Success', description: `"${song.title}" is now ${song.isAvailable ? 'unavailable' : 'available'}.` });
    });
  };

  const handleAddToQueue = (values: z.infer<typeof addToQueueSchema>) => {
    if (!selectedArtist || !selectedSong || !user) return;
    startTransition(() => {
      const songData = {
        singer: values.singer,
        artistName: selectedArtist.name,
        songTitle: selectedSong.title,
        specialAnnouncement: '',
        requestTime: Date.now(),
        status: 'queued' as 'queued',
        patronId: user.uid, // KJ is the patron in this case
      };
      const requestsCol = collection(firestore, 'song_requests');
      addDocumentNonBlocking(requestsCol, songData);
      toast({
        title: 'Song Added!',
        description: `"${selectedSong.title}" for ${values.singer} is in the queue.`
      });
      addToQueueForm.reset();
      setIsAddToQueueDialogOpen(false);
    });
  };

  const handleExportToCSV = () => {
    if (!artists || artists.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nothing to Export',
        description: 'The catalog is currently empty.',
      });
      return;
    }

    const headers = ['Artist', 'Song', 'Lyrics'];
    
    const escapeCsvField = (field: string | undefined | null): string => {
      if (field === null || field === undefined) {
        return '""';
      }
      const stringField = String(field);
      // If the field contains a comma, newline, or double quote, wrap it in double quotes.
      if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
        // Escape existing double quotes by doubling them
        const escapedField = stringField.replace(/"/g, '""');
        return `"${escapedField}"`;
      }
      return stringField;
    };

    const csvRows = [headers.join(',')];

    for (const artist of artists) {
      if (artist.songs && artist.songs.length > 0) {
        for (const song of artist.songs) {
          const row = [
            escapeCsvField(artist.name),
            escapeCsvField(song.title),
            escapeCsvField(song.lyrics),
          ];
          csvRows.push(row.join(','));
        }
      } else {
         const row = [escapeCsvField(artist.name), '',''];
         csvRows.push(row.join(','));
      }
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'catalog.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Export Complete',
      description: 'The song catalog has been downloaded as catalog.csv.'
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const parseCSV = (content: string): { Artist: string, Song: string, Lyrics: string }[] => {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        // This is a simple parser and may not handle all CSV edge cases.
        const values = line.split(',');
        const entry: any = {};
        for(let j=0; j < headers.length; j++){
            entry[headers[j]] = values[j]?.replace(/"/g, '').trim();
        }
        data.push(entry);
    }
    return data;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !firestore) return;

    startImportTransition(async () => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            try {
                const parsedData = parseCSV(content);

                const groupedByArtist: { [key: string]: { title: string, lyrics: string }[] } = {};
                for (const row of parsedData) {
                    const artistName = row.Artist;
                    if (!artistName) continue;
                    if (!groupedByArtist[artistName]) {
                        groupedByArtist[artistName] = [];
                    }
                    if (row.Song) {
                        groupedByArtist[artistName].push({ title: row.Song, lyrics: row.Lyrics || '' });
                    }
                }
                
                const artistsCollectionRef = collection(firestore, 'artists');
                const batch = writeBatch(firestore);

                for (const artistName in groupedByArtist) {
                    // Check if artist already exists
                    let artist = artists.find(a => a.name.toLowerCase() === artistName.toLowerCase());
                    let artistRef;

                    if (!artist) {
                        // Artist doesn't exist, create them
                        artistRef = doc(artistsCollectionRef);
                        batch.set(artistRef, { name: artistName, isAvailable: true });
                    } else {
                        artistRef = doc(artistsCollectionRef, artist.id);
                    }
                    
                    const songsToAdd = groupedByArtist[artistName];
                    for (const song of songsToAdd) {
                        const songRef = doc(collection(artistRef, 'songs'));
                        batch.set(songRef, { title: song.title, lyrics: song.lyrics, isAvailable: true });
                    }
                }
                
                await batch.commit();

                toast({ title: 'Import Successful', description: 'Catalog has been updated from the CSV file.' });
                if(refetchCatalog) refetchCatalog();

            } catch (error: any) {
                console.error("Error during CSV import:", error);
                toast({ variant: 'destructive', title: 'Import Failed', description: error.message || 'Could not parse or import the CSV file.' });
            }
        };
        reader.readAsText(file);
    });

    // Reset file input
    event.target.value = '';
  };


  const openSongDialog = (artist: Artist) => {
    setSelectedArtist(artist);
    songForm.setValue('artistId', artist.id!);
    setIsSongDialogOpen(true);
  };

  const openEditArtistDialog = (artist: Artist) => {
    editArtistForm.setValue('id', artist.id!);
    editArtistForm.setValue('name', artist.name);
    editArtistForm.setValue('imageUrl', artist.imageUrl || '');
    setIsEditArtistDialogOpen(true);
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

  const openAddToQueueDialog = (artist: Artist, song: CatalogSong) => {
    setSelectedArtist(artist);
    setSelectedSong(song);
    setIsAddToQueueDialogOpen(true);
  };

  if (isLoading) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-headline text-2xl flex items-center gap-3">
          <BookText />
          Manage Catalog
        </CardTitle>
        <div className="flex items-center gap-2">
           <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
           <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
             {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} 
             {isImporting ? 'Importing...' : 'Import from CSV'}
           </Button>
           <Button variant="outline" onClick={handleExportToCSV} disabled={artists.length === 0}>
             <Download className="mr-2 h-4 w-4" /> Export to CSV
           </Button>
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
                  <FormField control={artistForm.control} name="imageUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artist Image URL (Optional)</FormLabel>
                      <FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isPending ? "Adding..." : "Add Artist"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {artists.map((artist) => (
            <AccordionItem value={artist.id!} key={artist.id}>
              <div className="flex items-center group">
                 <AccordionTrigger className={cn("font-bold text-lg flex-grow", !artist.isAvailable && "text-muted-foreground line-through")}>{artist.name}</AccordionTrigger>
                 <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditArtistDialog(artist)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit Artist</span>
                    </Button>
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
                          <AlertDialogAction onClick={() => handleRemoveArtist(artist.id!, artist.name)} disabled={isPending}>
                            {isPending ? 'Removing...' : 'Remove'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 </div>
              </div>
              <AccordionContent>
                <div className="space-y-2 pl-4">
                  {artist.songs && artist.songs.sort((a,b) => a.title.localeCompare(b.title)).map((song) => (
                    <div key={song.id} className={cn("flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group", !song.isAvailable && "opacity-50")}>
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-primary" />
                        <span className={cn(!song.isAvailable && "line-through")}>{song.title}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openAddToQueueDialog(artist, song)}>
                            <ListPlus className="h-4 w-4 text-primary" />
                            <span className="sr-only">Add to Queue</span>
                        </Button>
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
                              <AlertDialogAction onClick={() => handleRemoveSong(artist.id!, song.id!, song.title)} disabled={isPending}>
                               {isPending ? 'Removing...' : 'Remove'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  {artist.songs && artist.songs.length === 0 && (
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
           {artists.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    <p>Your catalog is empty.</p>
                    <p>Click "Add Artist" to start building your song list.</p>
                </div>
            )}
        </Accordion>

        {/* Edit Artist Dialog */}
        <Dialog open={isEditArtistDialogOpen} onOpenChange={setIsEditArtistDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Artist</DialogTitle></DialogHeader>
            <Form {...editArtistForm}>
              <form onSubmit={editArtistForm.handleSubmit(handleEditArtist)} className="space-y-4">
                <FormField control={editArtistForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editArtistForm.control} name="imageUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Image URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isPending}>
                     {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

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
                  <Button type="submit" disabled={isPending}>
                     {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? "Adding..." : "Add Song"}
                    </Button>
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
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4"/>
                    {isPending ? "Saving..." : "Save Lyrics"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isAddToQueueDialogOpen} onOpenChange={setIsAddToQueueDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Add to Queue</DialogTitle>
                <DialogDescription>
                    Adding "{selectedSong?.title}" by {selectedArtist?.name}.
                </DialogDescription>
            </DialogHeader>
            <Form {...addToQueueForm}>
              <form onSubmit={addToQueueForm.handleSubmit(handleAddToQueue)} className="space-y-4">
                <FormField control={addToQueueForm.control} name="singer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Singer's Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Jane D." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
                  <Button type="submit" disabled={isPending}>
                     {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? "Adding..." : "Add to Queue"}
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
}
