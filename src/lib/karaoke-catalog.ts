
export type CatalogSong = {
  id?: string;
  title: string;
  lyrics?: string;
  isAvailable?: boolean;
};

export type Artist = {
  id?: string;
  name:string;
  songs: CatalogSong[];
  isAvailable?: boolean;
};

export const karaokeCatalog: Artist[] = [
  {
    name: 'Queen',
    isAvailable: true,
    songs: [
      { id: 'queen-1', title: 'Bohemian Rhapsody', lyrics: `Is this the real life? Is this just fantasy?`, isAvailable: true },
      { id: 'queen-2', title: 'Don\'t Stop Me Now', isAvailable: true },
      { id: 'queen-3', title: 'Another One Bites the Dust', isAvailable: true },
      { id: 'queen-4', title: 'Somebody to Love', isAvailable: true },
    ],
  },
  {
    name: 'Bon Jovi',
    isAvailable: true,
    songs: [
        { id: 'bonjovi-1', title: 'Livin\' on a Prayer', isAvailable: true },
        { id: 'bonjovi-2', title: 'You Give Love a Bad Name', isAvailable: true },
        { id: 'bonjovi-3', title: 'It\'s My Life', isAvailable: true },
    ],
  },
  {
    name: 'Journey',
    isAvailable: true,
    songs: [
        { id: 'journey-1', title: 'Don\'t Stop Believin\'', isAvailable: true },
        { id: 'journey-2', title: 'Any Way You Want It', isAvailable: true },
        { id: 'journey-3', title: 'Separate Ways (Worlds Apart)', isAvailable: true },
    ],
  },
  {
    name: 'Gloria Gaynor',
    isAvailable: true,
    songs: [
        { id: 'gloria-1', title: 'I Will Survive', isAvailable: true },
    ],
  },
  {
    name: 'Britney Spears',
    isAvailable: true,
    songs: [
        { id: 'britney-1', title: '...Baby One More Time', isAvailable: true },
        { id: 'britney-2', title: 'Toxic', isAvailable: true },
        { id: 'britney-3', title: 'Oops!... I Did It Again', isAvailable: true },
    ],
  },
  {
    name: 'ABBA',
    isAvailable: true,
    songs: [
        { id: 'abba-1', title: 'Dancing Queen', isAvailable: true },
        { id: 'abba-2', title: 'Mamma Mia', isAvailable: true },
        { id: 'abba-3', title: 'Gimme! Gimme! Gimme! (A Man After Midnight)', isAvailable: true },
    ]
  }
];
