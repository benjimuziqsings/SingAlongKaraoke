
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, onSnapshot, getDocs, query } from 'firebase/firestore';
import type { Artist, CatalogSong } from '@/lib/karaoke-catalog';

export interface UseCatalogResult {
  artists: Artist[];
  isLoading: boolean;
  error: Error | null;
}

const EMPTY_SONGS: CatalogSong[] = [];

export function useCatalog(): UseCatalogResult {
  const firestore = useFirestore();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const artistsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // We create a stable query reference here.
    return query(collection(firestore, 'artists'));
  }, [firestore]);

  useEffect(() => {
    if (!artistsQuery) {
      // If there's no firestore instance yet, do nothing.
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // onSnapshot listens for real-time updates to the 'artists' collection.
    const unsubscribe = onSnapshot(artistsQuery, async (snapshot) => {
      try {
        // Map over each artist document to fetch its 'songs' sub-collection.
        const artistsData = await Promise.all(snapshot.docs.map(async (artistDoc) => {
          const songsCollectionRef = collection(artistDoc.ref, 'songs');
          const songsSnapshot = await getDocs(songsCollectionRef);
          
          const songs = songsSnapshot.docs.length > 0 
            ? songsSnapshot.docs.map(songDoc => ({
                id: songDoc.id,
                ...songDoc.data(),
              } as CatalogSong))
            : EMPTY_SONGS; // Use the stable empty array reference
          
          return {
            id: artistDoc.id,
            ...artistDoc.data(),
            songs: songs,
          } as Artist;
        }));

        // Sort artists alphabetically by name before updating state.
        artistsData.sort((a, b) => a.name.localeCompare(b.name));
        
        setArtists(artistsData);
        setError(null);
      } catch (e: any) {
        console.error("Error processing catalog snapshot:", e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
      // This is the error callback for onSnapshot.
      console.error("Error fetching artists collection:", err);
      setError(err);
      setIsLoading(false);
    });

    // Cleanup function to unsubscribe from the listener when the component unmounts.
    return () => unsubscribe();
  }, [artistsQuery]); // This effect re-runs only if the artistsQuery reference changes.

  return { artists, isLoading, error };
}
