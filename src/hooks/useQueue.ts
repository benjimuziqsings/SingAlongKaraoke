
'use client';

import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Song, GroupedSong, RequesterInfo } from '@/lib/types';
import { useUser } from '@/firebase/provider';
import { useMemo, useState, useEffect, useCallback } from 'react';

// Define the structure for the hook's return value
export interface UseQueueResult {
  nowPlaying: GroupedSong | null;
  upcoming: GroupedSong[];
  held: GroupedSong[];
  history: GroupedSong[];
  isLoading: boolean;
  error: Error | null;
  refetch?: () => void; // Optional refetch function
}

/**
 * A hook to fetch and process the song queue from Firestore in real-time.
 */
export function useQueue(): UseQueueResult {
  const firestore = useFirestore();
  const [songs, setSongs] = useState<Song[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const songRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'song_requests'));
  }, [firestore]);

  const refetch = useCallback(async () => {
    if (!songRequestsQuery) return;
    setIsLoading(true);
    try {
        const snapshot = await getDocs(songRequestsQuery);
        const fetchedSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
        setSongs(fetchedSongs);
    } catch (err: any) {
        setError(err);
    } finally {
        setIsLoading(false);
    }
  }, [songRequestsQuery]);


  useEffect(() => {
    if (!songRequestsQuery) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(songRequestsQuery, (snapshot) => {
        const fetchedSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song));
        setSongs(fetchedSongs);
        setIsLoading(false);
    }, (err) => {
        console.error("Error fetching song requests:", err);
        setError(err);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [songRequestsQuery]);
  

  const { nowPlaying, upcoming, held, history } = useMemo(() => {
    if (!songs) {
      return { nowPlaying: null, upcoming: [], held: [], history: [] };
    }
    
    const groupedSongs: { [key: string]: GroupedSong } = {};

    for (const song of songs) {
        // Use a composite key of title and artist to group identical songs
        const key = `${song.songTitle}-${song.artistName}`;
        const requester: RequesterInfo = {
            singer: song.singer,
            announcement: song.specialAnnouncement,
            originalId: song.id,
        };

        if (groupedSongs[key]) {
            // Add requester to existing group
            groupedSongs[key].requesters.push(requester);
            // If the new song is more recent, update the group's request time
            if (song.requestTime < groupedSongs[key].requestTime) {
                groupedSongs[key].requestTime = song.requestTime;
            }
            // Also update the status to the most current one
             groupedSongs[key].status = song.status;

        } else {
            // Create a new group for this song
            groupedSongs[key] = {
                id: song.id,
                groupedId: key,
                title: song.songTitle,
                artist: song.artistName,
                status: song.status,
                requesters: [requester],
                requestTime: song.requestTime,
            };
        }
    }

    const allSongs = Object.values(groupedSongs);
    const nowPlaying = allSongs.find(song => song.status === 'playing') || null;
    const upcoming = allSongs
        .filter(song => song.status === 'queued')
        .sort((a, b) => {
            // Sort by number of requesters descending
            const requestersDiff = b.requesters.length - a.requesters.length;
            if (requestersDiff !== 0) {
                return requestersDiff;
            }
            // If requesters are equal, sort by request time ascending
            return a.requestTime - b.requestTime;
        });
    const held = allSongs
      .filter(song => song.status === 'held')
      .sort((a, b) => a.requestTime - b.requestTime);
    const history = allSongs
        .filter(song => song.status === 'finished')
        .sort((a, b) => b.requestTime - a.requestTime);

    return { nowPlaying, upcoming, held, history };
  }, [songs]);

  return { nowPlaying, upcoming, held, history, isLoading, error, refetch };
}
