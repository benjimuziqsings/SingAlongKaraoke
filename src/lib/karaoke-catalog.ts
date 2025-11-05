
export type CatalogSong = {
  title: string;
  lyrics?: string;
  isAvailable?: boolean;
};

export type Artist = {
  name:string;
  songs: CatalogSong[];
  isAvailable?: boolean;
};

export const karaokeCatalog: Artist[] = [
  {
    name: 'Queen',
    isAvailable: true,
    songs: [
      { title: 'Bohemian Rhapsody', lyrics: `Is this the real life? Is this just fantasy?`, isAvailable: true },
      { title: 'Don\'t Stop Me Now', isAvailable: true },
      { title: 'Another One Bites the Dust', isAvailable: true },
      { title: 'Somebody to Love', isAvailable: true },
    ],
  },
  {
    name: 'Bon Jovi',
    isAvailable: true,
    songs: [
        { title: 'Livin\' on a Prayer', isAvailable: true },
        { title: 'You Give Love a Bad Name', isAvailable: true },
        { title: 'It\'s My Life', isAvailable: true },
    ],
  },
  {
    name: 'Journey',
    isAvailable: true,
    songs: [
        { title: 'Don\'t Stop Believin\'', isAvailable: true },
        { title: 'Any Way You Want It', isAvailable: true },
        { title: 'Separate Ways (Worlds Apart)', isAvailable: true },
    ],
  },
  {
    name: 'Gloria Gaynor',
    isAvailable: true,
    songs: [
        { title: 'I Will Survive', isAvailable: true },
    ],
  },
  {
    name: 'Britney Spears',
    isAvailable: true,
    songs: [
        { title: '...Baby One More Time', isAvailable: true },
        { title: 'Toxic', isAvailable: true },
        { title: 'Oops!... I Did It Again', isAvailable: true },
    ],
  },
  {
    name: 'ABBA',
    isAvailable: true,
    songs: [
        { title: 'Dancing Queen', isAvailable: true },
        { title: 'Mamma Mia', isAvailable: true },
        { title: 'Gimme! Gimme! Gimme! (A Man After Midnight)', isAvailable: true },
    ]
  }
];
