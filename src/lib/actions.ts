'use server';

import { revalidatePath } from 'next/cache';
import { songQueue, reviews } from './data';
import type { GroupedSong, Song, Review } from './types';
import { db } from '@/firebase/admin';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import type { Artist, CatalogSong } from '@/lib/karaoke-catalog';
import { karaokeCatalog } from './karaoke-catalog';

const useFirestore = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

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
  
  if (useFirestore) {
    const artistsSnapshot = await getDocs(collection(db, 'artists'));
    for (const artistDoc of artistsSnapshot.docs) {
        const artist = artistDoc.data() as Artist;
        if (artist.isAvailable === false) {
            const songsSnapshot = await getDocs(collection(db, 'artists', artistDoc.id, 'songs'));
            songsSnapshot.forEach(songDoc => {
                locked.add(`${songDoc.data().title}|${artist.name}`);
            });
        } else {
            const songsSnapshot = await getDocs(collection(db, 'artists', artistDoc.id, 'songs'));
            songsSnapshot.forEach(songDoc => {
                const song = songDoc.data() as CatalogSong;
                if (song.isAvailable === false) {
                    locked.add(`${song.title}|${artist.name}`);
                }
            });
        }
    }
  }


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

export async function moveSongUp(songId: string) {
  const queuedSongs = songQueue
    .filter(s => s.status === 'queued')
    .sort((a, b) => a.createdAt - b.createdAt);
  
  const songToMove = songQueue.find(s => s.id === songId);
  if (!songToMove) return;

  const groupedSongs = groupSongs(queuedSongs);
  const songIndex = groupedSongs.findIndex(g => g.title === songToMove.title && g.artist === songToMove.artist);
  
  if (songIndex > 0) {
    const prevSongGroup = groupedSongs[songIndex - 1];
    
    // Swap createdAt timestamps
    const songToMoveTimestamp = songToMove.createdAt;
    
    // Update all songs in the group being moved
    songQueue.forEach(s => {
      if (s.title === songToMove.title && s.artist === songToMove.artist) {
        s.createdAt = prevSongGroup.createdAt;
      }
    });

    // Update all songs in the group being swapped with
    songQueue.forEach(s => {
      if (s.title === prevSongGroup.title && s.artist === prevSongGroup.artist) {
        s.createdAt = songToMoveTimestamp;
      }
    });
  }

  revalidatePath('/admin');
  revalidatePath('/');
}

export async function moveSongDown(songId: string) {
  const queuedSongs = songQueue
    .filter(s => s.status === 'queued')
    .sort((a, b) => a.createdAt - b.createdAt);
  
  const songToMove = songQueue.find(s => s.id === songId);
  if (!songToMove) return;

  const groupedSongs = groupSongs(queuedSongs);
  const songIndex = groupedSongs.findIndex(g => g.title === songToMove.title && g.artist === songToMove.artist);

  if (songIndex < groupedSongs.length - 1 && songIndex !== -1) {
    const nextSongGroup = groupedSongs[songIndex + 1];

    // Swap createdAt timestamps
    const songToMoveTimestamp = songToMove.createdAt;

    // Update all songs in the group being moved
    songQueue.forEach(s => {
      if (s.title === songToMove.title && s.artist === songToMove.artist) {
        s.createdAt = nextSongGroup.createdAt;
      }
    });

    // Update all songs in the group being swapped with
    songQueue.forEach(s => {
      if (s.title === nextSongGroup.title && s.artist === nextSongGroup.artist) {
        s.createdAt = songToMoveTimestamp;
      }
    });
  }

  revalidatePath('/admin');
  revalidatePath('/');
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
export async function getArtists(): Promise<Artist[]> {
    if (!useFirestore) {
      return karaokeCatalog.map((a, i) => ({...a, id: i.toString()}));
    }
    const artistsCol = collection(db, 'artists');
    const artistSnapshot = await getDocs(artistsCol);
    const artists: Artist[] = [];
    for (const artistDoc of artistSnapshot.docs) {
      const artistData = artistDoc.data();
      const songsCol = collection(db, 'artists', artistDoc.id, 'songs');
      const songSnapshot = await getDocs(songsCol);
      const songs = songSnapshot.docs.map(songDoc => ({ id: songDoc.id, ...songDoc.data() } as CatalogSong));
      artists.push({
        id: artistDoc.id,
        name: artistData.name,
        songs: songs.sort((a, b) => a.title.localeCompare(b.title)),
        isAvailable: artistData.isAvailable,
      });
    }
    return artists.sort((a, b) => a.name.localeCompare(b.name));
}


export async function addArtist(formData: FormData) {
    if (!useFirestore) return { error: 'Firestore is not configured.' };
    const artistName = formData.get('name') as string;

    const artistsCol = collection(db, 'artists');
    const q = await getDocs(artistsCol);
    const artistExists = q.docs.some(doc => doc.data().name.toLowerCase() === artistName.toLowerCase());

    if (!artistName || artistExists) {
        return { error: 'Artist already exists or name is invalid.' };
    }
    await addDoc(artistsCol, { name: artistName, isAvailable: true });
    revalidatePath('/admin');
    return { success: true };
}

export async function addSongToCatalog(formData: FormData) {
    if (!useFirestore) return { error: 'Firestore is not configured.' };
    const artistId = formData.get('artistId') as string;
    const title = formData.get('title') as string;

    if (!artistId || !title) {
        return { error: 'Artist not found or title is invalid.' };
    }

    const songsCol = collection(db, 'artists', artistId, 'songs');
    const q = await getDocs(songsCol);
    const songExists = q.docs.some(doc => doc.data().title.toLowerCase() === title.toLowerCase());

    if (songExists) {
        return { error: 'Song already exists for this artist.' };
    }

    await addDoc(songsCol, { title, isAvailable: true });
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}

export async function updateLyrics(formData: FormData) {
    if (!useFirestore) return { error: 'Firestore is not configured.' };
    const artistId = formData.get('artistId') as string;
    const songId = formData.get('songId') as string;
    const lyrics = formData.get('lyrics') as string;

    if (!artistId || !songId) {
        return { error: 'Artist or song not found.' };
    }
    const songRef = doc(db, 'artists', artistId, 'songs', songId);
    await updateDoc(songRef, { lyrics });
    revalidatePath('/admin');
    return { success: true };
}

export async function removeArtistFromCatalog(formData: FormData) {
    if (!useFirestore) return { error: 'Firestore is not configured.' };
    const artistId = formData.get('artistId') as string;
    if (!artistId) {
        return { error: 'Artist not found.' };
    }
    const artistRef = doc(db, 'artists', artistId);
    
    // Also delete all songs in the subcollection
    const songsCol = collection(db, 'artists', artistId, 'songs');
    const songSnapshot = await getDocs(songsCol);
    const batch = writeBatch(db);
    songSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    await deleteDoc(artistRef);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}

export async function removeSongFromCatalog(formData: FormData) {
    if (!useFirestore) return { error: 'Firestore is not configured.' };
    const artistId = formData.get('artistId') as string;
    const songId = formData.get('songId') as string;
    if (!artistId || !songId) {
        return { error: 'Artist or song not found.' };
    }
    const songRef = doc(db, 'artists', artistId, 'songs', songId);
    await deleteDoc(songRef);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}

export async function toggleArtistAvailability(formData: FormData) {
    if (!useFirestore) return { error: 'Firestore is not configured.' };
    const artistId = formData.get('artistId') as string;
    const currentAvailability = formData.get('isAvailable') === 'true';

    if (!artistId) {
        return { error: 'Artist not found.' };
    }
    const artistRef = doc(db, 'artists', artistId);
    await updateDoc(artistRef, { isAvailable: !currentAvailability });
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}

export async function toggleSongAvailability(formData: FormData) {
    if (!useFirestore) return { error: 'Firestore is not configured.' };
    const artistId = formData.get('artistId') as string;
    const songId = formData.get('songId') as string;
    const currentAvailability = formData.get('isAvailable') === 'true';
    if (!artistId || !songId) {
        return { error: 'Artist or song not found.' };
    }
    const songRef = doc(db, 'artists', artistId, 'songs', songId);
    await updateDoc(songRef, { isAvailable: !currentAvailability });
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true };
}
