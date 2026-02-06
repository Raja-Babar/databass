
'use server';

/**
 * @fileOverview An AI-powered parser for extracting and translating book details from a string.
 *
 * - parseAndTranslateEntry - A function that takes a string, parses it for book details, and translates them to Sindhi or English.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const EntryInputSchema = z.object({
  title: z.string().describe('The title of the book.'),
  author: z.string().describe('The author of the book.'),
});

const EntryOutputSchema = z.object({
    titleSindhi: z.string().describe('The translated Sindhi title.'),
    authorSindhi: z.string().describe('The translated Sindhi author name.'),
    titleEnglish: z.string().describe('The translated English title.'),
    authorEnglish: z.string().describe('The translated English author name.'),
});

export type ParseAndTranslateOutput = z.infer<typeof EntryOutputSchema>;


export async function parseAndTranslateEntry(title: string, author: string): Promise<ParseAndTranslateOutput> {
  return parseAndTranslateFlow({ title, author });
}

const prompt = ai.definePrompt({
  name: 'parseAndTranslatePrompt',
  input: { schema: EntryInputSchema },
  output: { schema: EntryOutputSchema },
  prompt: `You are a text translation expert.
  Translate the following book title and author name into both Sindhi and English.
  - If a field is in English, provide the Sindhi translation. The English output should be the same as the input.
  - If a field is in Sindhi, provide the English translation. The Sindhi output should be the same as the input.
  - If a field is mixed or unclear, attempt to provide the most likely translation for both.
  - Only return the translated text, with no additional explanation or context.

  Title: {{{title}}}
  Author: {{{author}}}
  `,
});

const parseAndTranslateFlow = ai.defineFlow(
  {
    name: 'parseAndTranslateFlow',
    inputSchema: EntryInputSchema,
    outputSchema: EntryOutputSchema,
  },
  async ({ title, author }) => {
    if (!title.trim() && !author.trim()) {
      return { titleSindhi: '', authorSindhi: '', titleEnglish: '', authorEnglish: '' };
    }
    const { output } = await prompt({ title, author });
    return output!;
  }
);
