import type { Song, Review } from './types';
import type { Artist } from './karaoke-catalog';

// In-memory store, will be reset on server restart.
// This is now empty and will be populated by user actions.
export const songQueue: Song[] = [];

export const reviews: Review[] = [];
