
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { Artist, CatalogSong } from '@/lib/karaoke-catalog';

export interface UseCatalogResult {
  artists: Artist[];
  isLoading: boolean;
  error: Error | null;
}

export function useCatalog(): UseCatalogResult {
  const firestore = useFirestore();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const artistsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'artists');
  }, [firestore]);

  useEffect(() => {
    if (!artistsQuery) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = onSnapshot(
      artistsQuery,
      async (artistsSnapshot) => {
        try {
          const artistsList: Artist[] = await Promise.all(
            artistsSnapshot.docs.map(async (artistDoc) => {
              const artistData = artistDoc.data();
               const songsCollectionRef = collection(artistDoc.ref, 'songs');
              const songsSnapshot = await getDocs(songsCollectionRef);
              
              const songs: CatalogSong[] = songsSnapshot.docs.map(songDoc => ({
                id: songDoc.id,
                ...(songDoc.data() as Omit<CatalogSong, 'id'>),
              }));

              return {
                id: artistDoc.id,
                name: artistData.name,
                isAvailable: artistData.isAvailable,
                songs: songs,
              };
            })
          );

          // Sort artists alphabetically
          artistsList.sort((a, b) => a.name.localeCompare(b.name));

          setArtists(artistsList);
          setError(null);
        } catch (e: any) {
          console.error("Error processing catalog snapshot:", e);
          setError(e);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching artists collection:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [artistsQuery]);

  return { artists, isLoading, error };
}
