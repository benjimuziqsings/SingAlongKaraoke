
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, onSnapshot, getDocs, query } from 'firebase/firestore';
import type { Artist, CatalogSong } from '@/lib/karaoke-catalog';

export interface UseCatalogResult {
  artists: Artist[];
  isLoading: boolean;
  error: Error | null;
  refetch?: () => void; // Optional refetch function
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

  const fetchCatalogData = useCallback(async (query: any) => {
    try {
        const artistsSnapshot = await getDocs(query);
        const artistsDataPromises = artistsSnapshot.docs.map(async (artistDoc) => {
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
  }, []);

  const refetch = useCallback(() => {
    if(artistsQuery) {
        setIsLoading(true);
        fetchCatalogData(artistsQuery);
    }
  }, [artistsQuery, fetchCatalogData]);

  useEffect(() => {
    if (!artistsQuery) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    const unsubscribe = onSnapshot(artistsQuery, async (snapshot) => {
        // When snapshot updates, just refetch all data.
        // This is simpler than trying to merge snapshot changes with subcollection data.
        fetchCatalogData(artistsQuery);
    }, (err) => {
      console.error("Error fetching artists collection:", err);
      setError(err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [artistsQuery, fetchCatalogData]);

  return { artists, isLoading, error, refetch };
}
