
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Artist, CatalogSong } from '@/lib/karaoke-catalog';
import { Review, Song } from './types';
import { collection, doc, addDoc, getDocs, getDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';


// This check ensures that Firestore is properly configured before any actions are taken.
// If the service account key is not set, the 'db' object will be null.
if (!db) {
    console.warn(`
    ****************************************************************
    *** FIREBASE_SERVICE_ACCOUNT_KEY is not set.                 ***
    *** All server actions will be disabled.                     ***
    *** Please follow the instructions in the README.md to set it up. ***
    ****************************************************************
  `);
}

/**
 * Fetches all artists and their songs from the catalog.
 */
export async function getArtists(): Promise<Artist[]> {
    if (!db) return [];
    try {
        const artistsSnapshot = await db.collection('artists').get();
        if (artistsSnapshot.empty) {
            return [];
        }

        const artists: Artist[] = await Promise.all(
            artistsSnapshot.docs.map(async (artistDoc: any) => {
                const artistData = artistDoc.data();
                const songsSnapshot = await artistDoc.ref.collection('songs').get();
                const songs: CatalogSong[] = songsSnapshot.docs.map((songDoc: any) => ({
                    id: songDoc.id,
                    ...songDoc.data(),
                }));
                return {
                    id: artistDoc.id,
                    name: artistData.name,
                    isAvailable: artistData.isAvailable,
                    songs: songs,
                };
            })
        );

        return artists;
    } catch (error) {
        console.error('Error fetching artists:', error);
        return [];
    }
}


export async function addSong(formData: FormData) {
    if (!db) return { error: 'Firestore is not configured.' };

    const songData = {
        singer: formData.get('singer') as string,
        artist: formData.get('artist') as string,
        title: formData.get('title') as string,
        announcement: (formData.get('announcement') as string) || '',
        createdAt: Date.now(),
        status: 'queued',
        isLocked: false,
        sortOrder: Date.now(), // Use timestamp for initial ordering
        patronId: formData.get('patronId') as string, // This will need to be passed from the client
    };

    try {
        await db.collection('song_requests').add(songData);
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function setNowPlaying(songId: string) {
    if (!db) return { error: 'Firestore is not configured.' };
    try {
        // Find the current 'playing' song and set it to 'finished'
        const playingSnapshot = await db.collection('song_requests').where('status', '==', 'playing').get();
        const batch = db.batch();
        playingSnapshot.forEach((doc: any) => {
            batch.update(doc.ref, { status: 'finished' });
        });

        // Set the new song to 'playing'
        const songRef = db.collection('song_requests').doc(songId);
        batch.update(songRef, { status: 'playing' });

        await batch.commit();

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}


export async function finishSong(songId: string) {
    if (!db) return { error: 'Firestore is not configured.' };
    try {
        await db.collection('song_requests').doc(songId).update({ status: 'finished' });
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function removeSong(songId: string) {
    if (!db) return { error: 'Firestore is not configured.' };
    try {
        await db.collection('song_requests').doc(songId).update({ status: 'removed' });
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}


export async function toggleLockSong(songId: string) {
    if (!db) return { error: 'Firestore is not configured.' };
    try {
        const songRef = db.collection('song_requests').doc(songId);
        const doc = await songRef.get();
        if (!doc.exists) return { error: 'Song not found.' };
        const isCurrentlyLocked = doc.data()?.isLocked || false;
        await songRef.update({ isLocked: !isCurrentlyLocked });

        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function moveSongUp(songId: string) {
    if (!db) return { error: 'Firestore is not configured.' };
    return await _moveSong(songId, 'up');
}

export async function moveSongDown(songId: string) {
    if (!db) return { error: 'Firestore is not configured.' };
    return await _moveSong(songId, 'down');
}

async function _moveSong(songId: string, direction: 'up' | 'down') {
    try {
        const songsRef = db.collection('song_requests');
        const q = songsRef.where('status', '==', 'queued').orderBy('sortOrder');
        const snapshot = await q.get();

        if (snapshot.empty) return { error: 'Queue is empty.' };

        const queue = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        const currentIndex = queue.findIndex(song => song.id === songId);

        if (currentIndex === -1) return { error: 'Song not found in queue.' };
        if (direction === 'up' && currentIndex === 0) return { success: true }; // Already at top
        if (direction === 'down' && currentIndex === queue.length - 1) return { success: true }; // Already at bottom

        const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        
        const currentSong = queue[currentIndex];
        const swapSong = queue[swapIndex];

        // Swap sortOrder values
        const batch = db.batch();
        const currentSongRef = songsRef.doc(currentSong.id);
        const swapSongRef = songsRef.doc(swapSong.id);

        batch.update(currentSongRef, { sortOrder: swapSong.sortOrder });
        batch.update(swapSongRef, { sortOrder: currentSong.sortOrder });

        await batch.commit();

        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}


export async function addArtist(formData: FormData) {
    if (!db) return { error: 'Firestore is not configured.' };
    try {
        const name = formData.get('name') as string;
        if (!name) return { error: 'Artist name is required.' };
        
        await db.collection('artists').add({
            name: name,
            isAvailable: true,
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}


export async function addSongToCatalog(formData: FormData) {
    if (!db) return { error: 'Firestore is not configured.' };
    try {
        const artistId = formData.get('artistId') as string;
        const title = formData.get('title') as string;
        if (!artistId || !title) return { error: 'Artist and title are required.' };

        await db.collection('artists').doc(artistId).collection('songs').add({
            title: title,
            isAvailable: true,
            lyrics: '',
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function updateLyrics(formData: FormData) {
    if (!db) return { error: 'Firestore is not configured.' };
    try {
        const artistId = formData.get('artistId') as string;
        const songId = formData.get('songId') as string;
        const lyrics = formData.get('lyrics') as string;
        if (!artistId || !songId) return { error: 'Artist and song ID are required.' };

        await db.collection('artists').doc(artistId).collection('songs').doc(songId).update({
            lyrics: lyrics,
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function removeArtistFromCatalog(formData: FormData) {
    if (!db) return { error: 'Firestore is not configured.' };
    try {
        const artistId = formData.get('artistId') as string;
        if (!artistId) return { error: 'Artist ID is required.' };
        
        const artistRef = db.collection('artists').doc(artistId);
        // Firestore doesn't support cascading deletes from the client/admin SDK,
        // so we must delete the subcollection documents manually.
        const songsSnapshot = await artistRef.collection('songs').get();
        const batch = db.batch();
        songsSnapshot.forEach((doc: any) => {
            batch.delete(doc.ref);
        });
        batch.delete(artistRef);

        await batch.commit();

        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function removeSongFromCatalog(formData: FormData) {
    if (!db) return { error: 'Firestore is not configured.' };
    try {
        const artistId = formData.get('artistId') as string;
        const songId = formData.get('songId') as string;
        if (!artistId || !songId) return { error: 'Artist and song ID are required.' };

        await db.collection('artists').doc(artistId).collection('songs').doc(songId).delete();

        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function toggleArtistAvailability(formData: FormData) {
    if (!db) return { error: 'Firestore is not configured.' };
    try {
        const artistId = formData.get('artistId') as string;
        const isAvailable = formData.get('isAvailable') === 'true';
        if (!artistId) return { error: 'Artist ID is required.' };

        await db.collection('artists').doc(artistId).update({
            isAvailable: !isAvailable,
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function toggleSongAvailability(formData: FormData) {
    if (!db) return { error: 'Firestore is not configured.' };
    try {
        const artistId = formData.get('artistId') as string;
        const songId = formData.get('songId') as string;
        const isAvailable = formData.get('isAvailable') === 'true';
        if (!artistId || !songId) return { error: 'Artist and song ID are required.' };

        await db.collection('artists').doc(artistId).collection('songs').doc(songId).update({
            isAvailable: !isAvailable,
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

export async function getReviews(): Promise<Review[]> {
    if (!db) return [];
    try {
        const snapshot = await db.collection('reviews').orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}


export async function addReview(formData: FormData) {
    if (!db) return { error: 'Firestore is not configured.' };
    const reviewData = {
        name: formData.get('name') as string,
        rating: Number(formData.get('rating')),
        comment: formData.get('comment') as string,
        createdAt: Date.now(),
    };

    try {
        await db.collection('reviews').add(reviewData);
        revalidatePath('/reviews');
        return { success: true };
    } catch (error: any) {
        return { error: error.message };
    }
}

    