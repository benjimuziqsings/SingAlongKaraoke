'use server';

import { revalidatePath } from 'next/cache';
import { songQueue } from './data';
import type { GroupedSong, Song } from './types';

function groupSongs(songs: Song[]): GroupedSong[] {
  const songGroups: Map<string, GroupedSong> = new Map();

  songs.forEach((song) => {
    const key = `${song.title.toLowerCase()}|${song.artist.toLowerCase()}`;
    if (!songGroups.has(key)) {
      songGroups.set(key, {
        id: song.id,
        title: song.title,
        artist: song.artist,
        requesters: [],
        status: song.status,
        createdAt: song.createdAt,
      });
    }

    const group = songGroups.get(key)!;
    group.requesters.push({
      singer: song.singer,
      announcement: song.announcement,
    });
    // Keep the createdAt of the first request
    if (song.createdAt < group.createdAt) {
      group.createdAt = song.createdAt;
    }
  });

  return Array.from(songGroups.values());
}

// READ actions
export async function getQueue(): Promise<GroupedSong[]> {
  const queuedSongs = songQueue
    .filter((s) => s.status === 'queued')
    .sort((a, b) => a.createdAt - b.createdAt);
  return groupSongs(queuedSongs);
}

export async function getSongHistory(): Promise<GroupedSong[]> {
  const finishedSongs = songQueue
    .filter((s) => s.status === 'finished')
    .sort((a, b) => b.createdAt - a.createdAt);
  return groupSongs(finishedSongs);
}

export async function getNowPlaying() {
  const nowPlayingSongs = songQueue.filter((s) => s.status === 'playing');
  if (nowPlayingSongs.length === 0) return null;
  const grouped = groupSongs(nowPlayingSongs);
  return grouped[0] || null;
}

export async function getFullQueue() {
  const activeSongs = songQueue
    .filter((s) => s.status !== 'finished')
    .sort((a, b) => {
      if (a.status === 'playing') return -1;
      if (b.status === 'playing') return 1;
      return a.createdAt - b.createdAt;
    });

  return groupSongs(activeSongs);
}

// WRITE actions
export async function addSong(formData: FormData) {
  const newSong: Song = {
    id: crypto.randomUUID(),
    title: formData.get('title') as string,
    artist: formData.get('artist') as string,
    singer: formData.get('singer') as string,
    announcement: formData.get('announcement') as string | undefined,
    status: 'queued',
    createdAt: Date.now(),
  };

  if (!newSong.title || !newSong.artist || !newSong.singer) {
    return { error: 'Please fill out all required fields.' };
  }

  songQueue.push(newSong);
  revalidatePath('/');
  revalidatePath('/admin');
  return { song: newSong };
}

export async function setNowPlaying(songId: string) {
  const songToPlay = songQueue.find(s => s.id === songId);
  if (!songToPlay) return;

  // Find all songs with the same title and artist
  const songsToUpdate = songQueue.filter(
    s => s.title === songToPlay.title && s.artist === songToPlay.artist && s.status === 'queued'
  );

  // Finish any currently playing songs
  songQueue.forEach(song => {
    if (song.status === 'playing') {
      song.status = 'finished';
    }
  });
  
  // Set all matching songs to 'playing'
  songsToUpdate.forEach(s => s.status = 'playing');
  
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function finishSong(songId: string) {
    const finishedSong = songQueue.find(s => s.id === songId);
    if (!finishedSong) return;

    // Mark all songs with the same title and artist as finished
    songQueue.forEach(song => {
        if (song.title === finishedSong.title && song.artist === finishedSong.artist) {
            song.status = 'finished';
        }
    });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function removeSong(songId: string) {
  const songToRemove = songQueue.find((s) => s.id === songId);
  if (!songToRemove) return;
  
  const { title, artist } = songToRemove;

  // Find all song IDs with the same title and artist to remove them all
  const songIdsToRemove = songQueue.filter(s => s.title === title && s.artist === artist).map(s => s.id);

  const newQueue = songQueue.filter(s => !songIdsToRemove.includes(s.id));
  
  // This is a bit of a hack since we are modifying the array in place.
  songQueue.length = 0;
  songQueue.push(...newQueue);

  revalidatePath('/');
  revalidatePath('/admin');
}
