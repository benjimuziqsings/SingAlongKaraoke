
'use client';

import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Song, GroupedSong, RequesterInfo } from '@/lib/types';
import { useUser } from '@/firebase/provider';
import { useMemo } from 'react';

// Define the structure for the hook's return value
export interface UseQueueResult {
  nowPlaying: GroupedSong | null;
  upcoming: GroupedSong[];
  history: GroupedSong[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * A hook to fetch and process the song queue from Firestore in real-time.
 */
export function useQueue(): UseQueueResult {
  const firestore = useFirestore();
  const { isUserLoading } = useUser();

  // Memoize the query to prevent re-creating it on every render
  const songRequestsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null; // Wait for user loading to complete
    return query(
      collection(firestore, 'song_requests'),
      orderBy('requestTime', 'desc')
    );
  }, [firestore, isUserLoading]);

  // Use the useCollection hook to get real-time updates
  const { data: songs, isLoading, error } = useCollection<Song>(songRequestsQuery);

  // Memoize the processed queue data
  const processedQueue = useMemo((): Omit<UseQueueResult, 'isLoading' | 'error'> => {
    if (!songs) {
      return {
        nowPlaying: null,
        upcoming: [],
        history: [],
      };
    }
    
    const validStatuses = ['queued', 'playing', 'finished'];
    const relevantSongs = songs.filter(song => validStatuses.includes(song.status));

    // Group songs by title and artist to handle multiple requests for the same song
    const groupedSongs = relevantSongs.reduce((acc, song) => {
      const key = `${song.songTitle}-${song.artistName}`;
      if (!acc[key]) {
        acc[key] = {
          id: song.id, // Use first song's ID for operations like 'play next'
          groupedId: key, // Stable ID for React keys
          title: song.songTitle,
          artist: song.artistName,
          status: song.status,
          requestTime: song.requestTime,
          requesters: [],
        };
      }
      const requester: RequesterInfo = {
        singer: song.singer,
        announcement: song.specialAnnouncement,
        originalId: song.id, // Keep track of the original doc ID
      };

      acc[key].requesters.push(requester);

      // Always update to the latest status and time from any song in the group
      if (song.requestTime > acc[key].requestTime) {
          acc[key].requestTime = song.requestTime;
      }
      // 'playing' status takes precedence
      if (acc[key].status !== 'playing' && song.status === 'playing') {
        acc[key].status = 'playing';
      }

      return acc;
    }, {} as Record<string, GroupedSong>);

    let queue = Object.values(groupedSongs);

    // Filter songs into their respective categories
    const nowPlaying = queue.find(song => song.status === 'playing') || null;
    
    const upcoming = queue
      .filter(song => song.status === 'queued')
      .sort((a, b) => a.requestTime - b.requestTime);

    const history = queue
      .filter(song => song.status === 'finished')
      .sort((a, b) => b.requestTime - a.requestTime); // Show most recent first

    return { nowPlaying, upcoming, history };
  }, [songs]);
  

  // The overall loading state is true if either the initial auth check is running OR the collection is loading.
  const combinedIsLoading = isUserLoading || isLoading;

  return { ...processedQueue, isLoading: combinedIsLoading, error };
}
