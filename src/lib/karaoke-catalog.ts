
export type CatalogSong = {
  id?: string;
  title: string;
  lyrics?: string;
  isAvailable?: boolean;
};

export type Artist = {
  id?: string;
  name:string;
  imageUrl?: string;
  songs: CatalogSong[];
  isAvailable?: boolean;
};

// This is now empty and will be populated from Firestore.
export const karaokeCatalog: Artist[] = [];
