


export type RequesterInfo = {
  singer: string;
  announcement?: string;
  originalId?: string;
};

export type SongStatus = 'queued' | 'playing' | 'finished' | 'removed' | 'held';

export type Song = {
  id: string;
  songTitle: string;
  artistName: string;
  singer: string;
  specialAnnouncement?: string;
  status: SongStatus;
  requestTime: number;
  patronId: string;
  tip?: number;
};

export type GroupedSong = {
  id: string;
  groupedId: string; // Stable ID for the group
  title: string;
  artist: string;
  requesters: RequesterInfo[];
  status: SongStatus;
  requestTime: number;
};

export type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: number;
};
