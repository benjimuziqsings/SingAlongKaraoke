
'use server';

import { revalidatePath } from 'next/cache';
import { songQueue, reviews, karaokeCatalog } from './data';
import type { GroupedSong, Song, Review } from './types';

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
        isLocked: song.isLocked,
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
    // If any of the songs in the group is locked, the whole group is locked.
    if(song.isLocked) {
      group.isLocked = true;
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

export async function getLockedSongs() {
  // This is a Set to prevent duplicates for songs locked by multiple requests.
  const locked = new Set<string>();
  songQueue.forEach(s => {
    if (s.isLocked) {
      locked.add(`${s.title}|${s.artist}`);
    }
  });
  
  karaokeCatalog.forEach(artist => {
    if (artist.isAvailable === false) {
        // if artist is unavailable, all their songs are unavailable
        artist.songs.forEach(song => {
            locked.add(`${song.title}|${artist.name}`);
        });
    } else {
        artist.songs.forEach(song => {
            if (song.isAvailable === false) {
                locked.add(`${song.title}|${artist.name}`);
            }
        });
    }
  });


  return Array.from(locked).map(l => {
    const [title, artist] = l.split('|');
    return { title, artist };
  });
}

// WRITE actions
export async function addSong(formData: FormData) {
  const newSong: Song = {
    id: crypto.randomUUID(),
    singer: formData.get('singer') as string,
    title: formData.get('title') as string,
    artist: formData.get('artist') as string,
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

export async function toggleLockSong(songId: string) {
    const songToToggle = songQueue.find(s => s.id === songId);
    if (!songToToggle) return;

    const currentlyLocked = !!songToToggle.isLocked;

    // Toggle lock status for all songs with the same title and artist
    songQueue.forEach(song => {
        if (song.title === songToToggle.title && song.artist === songToToggle.artist) {
            song.isLocked = !currentlyLocked;
        }
    });
    revalidatePath('/admin');
    revalidatePath('/'); // To update catalog
}


// Review actions
export async function getReviews(): Promise<Review[]> {
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addReview(formData: FormData) {
  const newReview: Review = {
    id: crypto.randomUUID(),
    name: formData.get('name') as string,
    rating: parseInt(formData.get('rating') as string, 10),
    comment: formData.get('comment') as string,
    createdAt: Date.now(),
  };

  if (!newReview.name || !newReview.rating || !newReview.comment) {
    return { error: 'Please fill out all required fields.' };
  }

  reviews.push(newReview);
  revalidatePath('/reviews');
  return { review: newReview };
}


// Catalog Management Actions
export async function addArtist(formData: FormData) {
    const artistName = formData.get('name') as string;
    if (!artistName || karaokeCatalog.some(a => a.name.toLowerCase() === artistName.toLowerCase())) {
        return { error: 'Artist already exists or name is invalid.' };
    }
    karaokeCatalog.push({ name: artistName, songs: [], isAvailable: true });
    karaokeCatalog.sort((a, b) => a.name.localeCompare(b.name));
    revalidatePath('/admin');
    return { success: true };
}

export async function addSongToCatalog(formData: FormData) {
    const artistName = formData.get('artistName') as string;
    const title = formData.get('title') as string;
    const artist = karaokeCatalog.find(a => a.name === artistName);
    if (!artist || !title) {
        return { error: 'Artist not found or title is invalid.' };
    }
    if (artist.songs.some(s => s.title.toLowerCase() === title.toLowerCase())) {
        return { error: 'Song already exists for this artist.' };
    }
    artist.songs.push({ title, isAvailable: true });
    artist.songs.sort((a, b) => a.title.localeCompare(b.title));
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}

export async function updateLyrics(formData: FormData) {
    const artistName = formData.get('artistName') as string;
    const title = formData.get('title') as string;
    const lyrics = formData.get('lyrics') as string;

    const artist = karaokeCatalog.find(a => a.name === artistName);
    if (!artist) {
        return { error: 'Artist not found.' };
    }
    const song = artist.songs.find(s => s.title === title);
    if (!song) {
        return { error: 'Song not found.' };
    }
    song.lyrics = lyrics;
    revalidatePath('/admin');
    return { success: true };
}

export async function removeArtistFromCatalog(formData: FormData) {
    const artistName = formData.get('artistName') as string;
    const index = karaokeCatalog.findIndex(a => a.name === artistName);
    if (index === -1) {
        return { error: 'Artist not found.' };
    }
    karaokeCatalog.splice(index, 1);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}

export async function removeSongFromCatalog(formData: FormData) {
    const artistName = formData.get('artistName') as string;
    const title = formData.get('title') as string;
    const artist = karaokeCatalog.find(a => a.name === artistName);
    if (!artist) {
        return { error: 'Artist not found.' };
    }
    const songIndex = artist.songs.findIndex(s => s.title === title);
    if (songIndex === -1) {
        return { error: 'Song not found.' };
    }
    artist.songs.splice(songIndex, 1);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}

export async function toggleArtistAvailability(formData: FormData) {
    const artistName = formData.get('artistName') as string;
    const artist = karaokeCatalog.find(a => a.name === artistName);
    if (!artist) {
        return { error: 'Artist not found.' };
    }
    artist.isAvailable = artist.isAvailable === false; // Toggle
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}

export async function toggleSongAvailability(formData: FormData) {
    const artistName = formData.get('artistName') as string;
    const title = formData.get('title') as string;
    const artist = karaokeCatalog.find(a => a.name === artistName);
    if (!artist) {
        return { error: 'Artist not found.' };
    }
    const song = artist.songs.find(s => s.title === title);
    if (!song) {
        return { error: 'Song not found.' };
    }
    song.isAvailable = song.isAvailable === false; // Toggle
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}
