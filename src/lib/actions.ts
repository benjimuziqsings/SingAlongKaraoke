'use server';

import { revalidatePath } from 'next/cache';
import { songQueue } from './data';
import type { Song } from './types';

// READ actions
export async function getQueue() {
  return songQueue
    .filter((s) => s.status === 'queued')
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getNowPlaying() {
  return songQueue.find((s) => s.status === 'playing') || null;
}

export async function getFullQueue() {
  return songQueue
    .filter((s) => s.status !== 'finished')
    .sort((a, b) => {
      if (a.status === 'playing') return -1;
      if (b.status === 'playing') return 1;
      return a.createdAt - b.createdAt;
    });
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
  const currentPlaying = songQueue.find((song) => song.status === 'playing');
  if (currentPlaying) {
    // We don't mark as finished here, just move it to the queue
    // to allow the KJ to re-play if needed. A separate 'finish' action is better.
    // Let's change this: marking as 'finished' is better as per the prompt.
    currentPlaying.status = 'finished';
  }

  const song = songQueue.find((s) => s.id === songId);
  if (song) {
    song.status = 'playing';
  }
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function finishSong(songId: string) {
  const song = songQueue.find((s) => s.id === songId);
  if (song) {
    song.status = 'finished';
  }
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function removeSong(songId: string) {
  const index = songQueue.findIndex((s) => s.id === songId);
  if (index > -1) {
    songQueue.splice(index, 1);
  }
  revalidatePath('/');
  revalidatePath('/admin');
}
