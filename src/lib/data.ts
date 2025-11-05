import type { Song } from './types';

// In-memory store, will be reset on server restart.
export const songQueue: Song[] = [
  { id: '1', title: 'Bohemian Rhapsody', artist: 'Queen', singer: 'Freddie', status: 'playing', createdAt: Date.now() - 200000, announcement: 'This one is for Mary!' },
  { id: '2', title: 'Livin\' on a Prayer', artist: 'Bon Jovi', singer: 'Jane D.', status: 'queued', createdAt: Date.now() - 100000 },
  { id: '3', title: 'Don\'t Stop Believin\'', artist: 'Journey', singer: 'John S.', status: 'queued', createdAt: Date.now() - 50000 },
  { id: '4', title: 'I Will Survive', artist: 'Gloria Gaynor', singer: 'Susan', status: 'queued', createdAt: Date.now() },
  { id: '5', title: '...Baby One More Time', artist: 'Britney Spears', singer: 'Mike', status: 'queued', createdAt: Date.now() + 10000 },
];
