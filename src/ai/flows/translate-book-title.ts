
'use server';

/**
 * @fileOverview An AI-powered text translator to Sindhi.
 *
 * - translateToSindhiFlow - A function that translates given text to Sindhi.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslationInputSchema = z.string();
const TranslationOutputSchema = z.string();

export async function translateBookTitle(text: string): Promise<string> {
  return translateToSindhiFlow(text);
}

const prompt = ai.definePrompt({
  name: 'translateToSindhiPrompt',
  input: { schema: TranslationInputSchema },
  output: { schema: TranslationOutputSchema },
  prompt: `Translate the following book title and/or author name into Sindhi.
  If the input is already in Sindhi, return the original input.
  Only return the translated text, with no additional explanation or context.

  Input: {{{text}}}
  `,
});

const translateToSindhiFlow = ai.defineFlow(
  {
    name: 'translateToSindhiFlow',
    inputSchema: TranslationInputSchema,
    outputSchema: TranslationOutputSchema,
  },
  async text => {
    if (!text.trim()) {
      return '';
    }
    const { output } = await prompt(text);
    return output!;
  }
);
