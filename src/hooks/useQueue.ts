
'use client';

import { useMemoFirebase } from '@/firebase/provider';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Song, GroupedSong, RequesterInfo } from '@/lib/types';
import { useUser } from '@/firebase/provider';

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
  const { user } = useUser();

  // Memoize the query to prevent re-creating it on every render
  const songRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'song_requests'),
      where('status', 'in', ['queued', 'playing', 'finished']),
      orderBy('status', 'asc'), // Sort by status first
      orderBy('sortOrder', 'asc'), // Then by the assigned sortOrder
      orderBy('createdAt', 'asc') // Finally by creation time
    );
  }, [firestore]);

  // Use the useCollection hook to get real-time updates
  const { data: songs, isLoading, error } = useCollection<Song>(songRequestsQuery);

  // Memoize the processed queue data
  const processedQueue = useMemoFirebase((): Omit<UseQueueResult, 'isLoading' | 'error' | 'mySongs'> => {
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
      .sort((a, b) => b.createdAt - a.createdAt); // Show most recent first

    return { nowPlaying, upcoming, history };
  }, [songs]);
  
  const mySongs = useMemoFirebase(() => {
    if (!songs || !user) return [];
    return songs.filter(song => song.patronId === user.uid);
  }, [songs, user]);

  return { ...processedQueue, mySongs, isLoading, error };
}
