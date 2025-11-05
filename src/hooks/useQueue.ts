
'use client';

import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Song, GroupedSong, RequesterInfo } from '@/lib/types';
import { useUser } from '@/firebase/provider';
import { useMemo } from 'react';

// Define the structure for the hook's return value
export interface UseQueueResult {
  nowPlaying: GroupedSong | null;
  upcoming: GroupedSong[];
  history: GroupedSong[];
  mySongs: Song[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * A hook to fetch and process the song queue from Firestore in real-time.
 */
export function useQueue(): UseQueueResult {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // Memoize the query to prevent re-creating it on every render
  // IMPORTANT: This query now depends on isUserLoading. It will be null until auth state is resolved.
  const songRequestsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null; // Wait for user loading to complete
    return query(
      collection(firestore, 'song_requests'),
      where('status', 'in', ['queued', 'playing', 'finished']),
      orderBy('status', 'asc'), // Sort by status first
      orderBy('sortOrder', 'asc'), // Then by the assigned sortOrder
      orderBy('createdAt', 'asc') // Finally by creation time
    );
  }, [firestore, isUserLoading]);

  // Use the useCollection hook to get real-time updates
  // This hook will now wait until songRequestsQuery is not null
  const { data: songs, isLoading, error } = useCollection<Song>(songRequestsQuery);

  // Memoize the processed queue data
  const processedQueue = useMemo((): Omit<UseQueueResult, 'isLoading' | 'error' | 'mySongs'> => {
    if (!songs) {
      return {
        nowPlaying: null,
        upcoming: [],
        history: [],
      };
    }

    // Group songs by title and artist to handle multiple requests for the same song
    const groupedSongs = songs.reduce((acc, song) => {
      const key = `${song.title}-${song.artist}`;
      if (!acc[key]) {
        acc[key] = {
          id: song.id,
          title: song.title,
          artist: song.artist,
          status: song.status,
          createdAt: song.createdAt,
          isLocked: song.isLocked,
          sortOrder: song.sortOrder,
          requesters: [],
        };
      }
      const requester: RequesterInfo = {
        singer: song.singer,
        announcement: song.announcement,
      };
      acc[key].requesters.push(requester);
      return acc;
    }, {} as Record<string, GroupedSong>);

    const queue = Object.values(groupedSongs);

    // Filter songs into their respective categories
    const nowPlaying = queue.find(song => song.status === 'playing') || null;
    const upcoming = queue.filter(song => song.status === 'queued');
    const history = queue
      .filter(song => song.status === 'finished')
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Show most recent first

    return { nowPlaying, upcoming, history };
  }, [songs]);
  
  const mySongs = useMemo(() => {
    if (!songs || !user) return [];
    return songs.filter(song => song.patronId === user.uid);
  }, [songs, user]);

  // The overall loading state is true if either the initial auth check is running OR the collection is loading.
  const combinedIsLoading = isUserLoading || isLoading;

  return { ...processedQueue, mySongs, isLoading: combinedIsLoading, error };
}
