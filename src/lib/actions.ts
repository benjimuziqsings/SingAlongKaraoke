
'use server';

import { revalidatePath } from 'next/cache';
import type { Artist, CatalogSong } from '@/lib/karaoke-catalog';
import { Review, Song } from './types';

// =====================================================================
// THIS IS A TEMPORARY IMPLEMENTATION.
// These functions will be replaced with real-time Firestore logic.
// They are here to prevent build errors in the UI components.
// =====================================================================

const notImplementedError = { error: 'This feature is not yet implemented with real-time data.' };

function logUnimplemented(functionName: string) {
    console.log(`actions.ts: ${functionName} is not implemented for real-time Firestore yet.`);
}

export async function getArtists(): Promise<Artist[]> {
    logUnimplemented('getArtists');
    return [];
}

export async function addSong(formData: FormData) {
    logUnimplemented('addSong');
    return notImplementedError;
}

export async function getLockedSongs(): Promise<string[]> {
    logUnimplemented('getLockedSongs');
    return [];
}

export async function setNowPlaying(songId: string) {
    logUnimplemented('setNowPlaying');
     return notImplementedError;
}

export async function finishSong(songId: string) {
    logUnimplemented('finishSong');
     return notImplementedError;
}

export async function removeSong(songId: string) {
    logUnimplemented('removeSong');
     return notImplementedError;
}

export async function toggleLockSong(songId: string) {
    logUnimplemented('toggleLockSong');
     return notImplementedError;
}

export async function moveSongUp(songId: string) {
    logUnimplemented('moveSongUp');
     return notImplementedError;
}

export async function moveSongDown(songId: string) {
    logUnimplemented('moveSongDown');
     return notImplementedError;
}

export async function addArtist(formData: FormData) {
    logUnimplemented('addArtist');
    return notImplementedError;
}

export async function addSongToCatalog(formData: FormData) {
    logUnimplemented('addSongToCatalog');
    return notImplementedError;
}

export async function updateLyrics(formData: FormData) {
    logUnimplemented('updateLyrics');
    return notImplementedError;
}

export async function removeArtistFromCatalog(formData: FormData) {
    logUnimplemented('removeArtistFromCatalog');
    return notImplementedError;
}

export async function removeSongFromCatalog(formData: FormData) {
    logUnimplemented('removeSongFromCatalog');
    return notImplementedError;
}

export async function toggleArtistAvailability(formData: FormData) {
    logUnimplemented('toggleArtistAvailability');
    return notImplementedError;
}

export async function toggleSongAvailability(formData: FormData) {
    logUnimplemented('toggleSongAvailability');
    return notImplementedError;
}

export async function getReviews(): Promise<Review[]> {
    logUnimplemented('getReviews');
    return [];
}

export async function addReview(formData: FormData) {
    logUnimplemented('addReview');
    return notImplementedError;
}
