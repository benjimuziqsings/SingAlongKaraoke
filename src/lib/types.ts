export type Song = {
  id: string;
  title: string;
  artist: string;
  singer: string;
  announcement?: string;
  status: 'queued' | 'playing' | 'finished';
  createdAt: number;
};
