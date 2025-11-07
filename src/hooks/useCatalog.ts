
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
    return query(collection(firestore, 'artists'));
  }, [firestore]);

  useEffect(() => {
    if (!artistsQuery) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const unsubscribe = onSnapshot(artistsQuery, async (snapshot) => {
      try {
        const artistsDataPromises = snapshot.docs.map(async (artistDoc) => {
          const songsCollectionRef = collection(artistDoc.ref, 'songs');
          const songsSnapshot = await getDocs(songsCollectionRef);
          
          const songs = songsSnapshot.docs.length > 0 
            ? songsSnapshot.docs.map(songDoc => ({
                id: songDoc.id,
                ...songDoc.data(),
              } as CatalogSong))
            : EMPTY_SONGS;
          
          return {
            id: artistDoc.id,
            ...artistDoc.data(),
            songs: songs,
          } as Artist;
        });

        const newArtistsData = await Promise.all(artistsDataPromises);
        newArtistsData.sort((a, b) => a.name.localeCompare(b.name));
        
        setArtists(currentArtists => {
          // A simple JSON.stringify check to prevent re-renders if the data is identical.
          if (JSON.stringify(currentArtists) === JSON.stringify(newArtistsData)) {
            return currentArtists;
          }
          return newArtistsData;
        });

        setError(null);
      } catch (e: any) {
        console.error("Error processing catalog snapshot:", e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
      console.error("Error fetching artists collection:", err);
      setError(err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [artistsQuery]);

  return { artists, isLoading, error };
}
