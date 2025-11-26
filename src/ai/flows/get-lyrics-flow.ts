'use server';
/**
 * @fileOverview A Genkit flow to retrieve song lyrics.
 *
 * - getLyrics - A function that retrieves lyrics for a given song.
 * - GetLyricsInput - The input type for the getLyrics function.
 * - GetLyricsOutput - The return type for the getLyrics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { karaokeCatalog } from '@/lib/karaoke-catalog';

const GetLyricsInputSchema = z.object({
  title: z.string().describe('The title of the song.'),
  artist: z.string().describe('The artist of the song.'),
});
export type GetLyricsInput = z.infer<typeof GetLyricsInputSchema>;

const GetLyricsOutputSchema = z.object({
  lyrics: z.string().describe('The lyrics of the song.'),
});
export type GetLyricsOutput = z.infer<typeof GetLyricsOutputSchema>;


const lyricsPrompt = ai.definePrompt({
  name: 'lyricsPrompt',
  input: { schema: GetLyricsInputSchema },
  output: { schema: GetLyricsOutputSchema },
  prompt: `Find the lyrics for the song "{{title}}" by "{{artist}}". Return only the lyrics. If you cannot find the lyrics, return a message saying "Lyrics not found.".`,
});


const getLyricsFlow = ai.defineFlow(
  {
    name: 'getLyricsFlow',
    inputSchema: GetLyricsInputSchema,
    outputSchema: GetLyricsOutputSchema,
  },
  async (input) => {
    // First, check our own catalog
    const artist = karaokeCatalog.find(a => a.name === input.artist);
    const song = artist?.songs.find(s => s.title === input.title);

    if (song?.lyrics) {
      return { lyrics: song.lyrics };
    }

    // If not found, use the AI prompt
    const { output } = await lyricsPrompt(input);
    
    return output!;
  }
);

export async function getLyrics(input: GetLyricsInput): Promise<GetLyricsOutput> {
  return getLyricsFlow(input);
}
