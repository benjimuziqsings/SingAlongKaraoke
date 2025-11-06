

export type RequesterInfo = {
  singer: string;
  announcement?: string;
  originalId?: string;
};

export type SongStatus = 'queued' | 'playing' | 'finished' | 'removed';

export type Song = {
  id: string;
  title: string;
  artist: string;
  singer: string;
  announcement?: string;
  status: SongStatus;
  createdAt: number;
  patronId: string;
  isLocked: boolean;
  sortOrder: number;
};

export type GroupedSong = {
  id: string;
  groupedId: string; // Stable ID for the group
  title: string;
  artist: string;
  requesters: RequesterInfo[];
  status: SongStatus;
  createdAt: number;
  isLocked?: boolean;
  sortOrder?: number;
};

export type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: number;
};
