
'use server';

import { translateBookTitle as translateToSindhi } from '@/ai/flows/translate-book-title';

export async function translateBookTitle(text: string): Promise<string> {
  try {
    const translation = await translateToSindhi(text);
    return translation;
  } catch (error) {
    console.error('Error translating text:', error);
    return ''; // Return empty string on error
  }
}
