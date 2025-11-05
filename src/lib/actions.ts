
'use server';

import { revalidatePath } from 'next/cache';
import type { Artist, CatalogSong } from '@/lib/karaoke-catalog';
import { Review, Song } from './types';

// In a real app, you would use a database. For this example, we're using
// an in-memory array.
let songQueue: Song[] = [];
let reviews: Review[] = [];

// =====================================================================
// THIS IS A TEMPORARY IMPLEMENTATION.
// These functions will be replaced with real-time Firestore logic.
// They are here to prevent build errors in the UI components.
// =====================================================================

function logUnimplemented(functionName: string) {
    console.log(`actions.ts: ${functionName} is not implemented for real-time Firestore yet.`);
}

export async function getArtists(): Promise<Artist[]> {
    logUnimplemented('getArtists');
    return [];
}

export async function addSong(formData: FormData) {
    logUnimplemented('addSong');
    return { error: 'Song submission is being updated for real-time. Please try again shortly.' };
}

export async function getLockedSongs(): Promise<string[]> {
    logUnimplemented('getLockedSongs');
    return [];
}

export async function setNowPlaying(songId: string) {
    logUnimplemented('setNowPlaying');
}

export async function finishSong(songId: string) {
    logUnimplemented('finishSong');
}

export async function removeSong(songId: string) {
    logUnimplemented('removeSong');
}

export async function toggleLockSong(songId: string) {
    logUnimplemented('toggleLockSong');
}

export async function moveSongUp(songId: string) {
    logUnimplemented('moveSongUp');
}

export async function moveSongDown(songId: string) {
    logUnimplemented('moveSongDown');
}

export async function addArtist(formData: FormData) {
    logUnimplemented('addArtist');
}

export async function addSongToCatalog(formData: FormData) {
    logUnimplemented('addSongToCatalog');
}

export async function updateLyrics(formData: FormData) {
    logUnimplemented('updateLyrics');
}

export async function removeArtistFromCatalog(formData: FormData) {
    logUnimplemented('removeArtistFromCatalog');
}

export async function removeSongFromCatalog(formData: FormData) {
    logUnimplemented('removeSongFromCatalog');
}

export async function toggleArtistAvailability(formData: FormData) {
    logUnimplemented('toggleArtistAvailability');
}

export async function toggleSongAvailability(formData: FormData) {
    logUnimplemented('toggleSongAvailability');
}

export async function getReviews(): Promise<Review[]> {
    logUnimplemented('getReviews');
    return [];
}

export async function addReview(formData: FormData) {
    logUnimplemented('addReview');
    return { error: 'Review submission is being updated for real-time. Please try again shortly.' };
}
