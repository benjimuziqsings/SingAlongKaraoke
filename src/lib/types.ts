
export type RequesterInfo = {
  singer: string;
  announcement?: string;
};

export type SongStatus = 'queued' | 'playing' | 'finished';

export type Song = {
  id: string;
  title: string;
  artist: string;
  singer: string;
  announcement?: string;
  status: SongStatus;
  createdAt: number;
  isLocked?: boolean;
};

export type GroupedSong = {
  title: string;
  artist: string;
  requesters: RequesterInfo[];
  status: SongStatus;
  createdAt: number;
  id: string;
  isLocked?: boolean;
};

export type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: number;
};
