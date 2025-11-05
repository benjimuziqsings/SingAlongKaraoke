
export type CatalogSong = {
  title: string;
  lyrics?: string;
};

export type Artist = {
  name: string;
  songs: CatalogSong[];
};

export const karaokeCatalog: Artist[] = [
  {
    name: 'Queen',
    songs: [
      { title: 'Bohemian Rhapsody', lyrics: `Is this the real life? Is this just fantasy?` },
      { title: 'Don\'t Stop Me Now' },
      { title: 'Another One Bites the Dust' },
      { title: 'Somebody to Love' },
    ],
  },
  {
    name: 'Bon Jovi',
    songs: [
        { title: 'Livin\' on a Prayer' },
        { title: 'You Give Love a Bad Name' },
        { title: 'It\'s My Life' },
    ],
  },
  {
    name: 'Journey',
    songs: [
        { title: 'Don\'t Stop Believin\'' },
        { title: 'Any Way You Want It' },
        { title: 'Separate Ways (Worlds Apart)'},
    ],
  },
  {
    name: 'Gloria Gaynor',
    songs: [
        { title: 'I Will Survive' },
    ],
  },
  {
    name: 'Britney Spears',
    songs: [
        { title: '...Baby One More Time' },
        { title: 'Toxic' },
        { title: 'Oops!... I Did It Again' },
    ],
  },
  {
    name: 'ABBA',
    songs: [
        { title: 'Dancing Queen' },
        { title: 'Mamma Mia' },
        { title: 'Gimme! Gimme! Gimme! (A Man After Midnight)' },
    ]
  }
];
