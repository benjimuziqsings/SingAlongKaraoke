
'use client';

import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
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

  useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const artistsCollectionRef = collection(firestore, 'artists');

    const unsubscribe = onSnapshot(
      artistsCollectionRef,
      async (artistsSnapshot) => {
        try {
          const artistsList: Artist[] = await Promise.all(
            artistsSnapshot.docs.map(async (artistDoc) => {
              const artistData = artistDoc.data();
              const songsCollectionRef = collection(artistDoc.ref, 'songs');
              
              // We need another snapshot listener for the subcollection, but for simplicity
              // in a hook, we will fetch it once. For fully real-time subcollections,
              // a more complex hook structure would be needed.
              const songsSnapshot = await new Promise<any[]>((resolve, reject) => {
                const unsubSongs = onSnapshot(songsCollectionRef, (snap) => {
                  const songsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  resolve(songsData);
                  unsubSongs(); // Unsubscribe after fetching once to avoid nested listeners in this hook
                }, reject);
              });

              return {
                id: artistDoc.id,
                name: artistData.name,
                isAvailable: artistData.isAvailable,
                songs: songsSnapshot as CatalogSong[],
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
  }, [firestore]);

  return { artists, isLoading, error };
}

    