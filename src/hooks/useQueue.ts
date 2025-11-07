
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
  isLoading: boolean;
  error: Error | null;
}

/**
 * A hook to fetch and process the song queue from Firestore in real-time.
 */
export function useQueue(): UseQueueResult {
  const firestore = useFirestore();
  const { user } = useUser();

  const songRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'song_requests'));
  }, [firestore]);
  
  const { data: songs, isLoading, error } = useCollection<Song>(songRequestsQuery);

  const { nowPlaying, upcoming, history } = useMemo(() => {
    if (!songs) {
      return { nowPlaying: null, upcoming: [], history: [] };
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
            if (song.requestTime > groupedSongs[key].requestTime) {
                groupedSongs[key].requestTime = song.requestTime;
            }
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
        .sort((a, b) => a.requestTime - b.requestTime);
    const history = allSongs
        .filter(song => song.status === 'finished')
        .sort((a, b) => b.requestTime - a.requestTime);

    return { nowPlaying, upcoming, history };
  }, [songs]);

  return { nowPlaying, upcoming, history, isLoading, error };
}

