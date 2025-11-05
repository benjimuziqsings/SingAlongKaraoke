
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
};

export type GroupedSong = {
  title: string;
  artist: string;
  requesters: RequesterInfo[];
  status: SongStatus;
  createdAt: number;
  id: string;
};
