// src/ai/flows/generate-report-recommendations.ts
'use server';

/**
 * @fileOverview An AI-powered report recommendation generator.
 *
 * - generateReportRecommendations - A function that generates report content and formatting recommendations.
 * - GenerateReportRecommendationsInput - The input type for the generateReportRecommendations function.
 * - GenerateReportRecommendationsOutput - The return type for the generateReportRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateReportRecommendationsInputSchema = z.object({
  pettyCashRecords: z.string().describe('A JSON string of petty cash records.'),
  scanningProgressRecords: z.string().describe('A JSON string of scanning progress records.'),
});
export type GenerateReportRecommendationsInput = z.infer<typeof GenerateReportRecommendationsInputSchema>;

const GenerateReportRecommendationsOutputSchema = z.object({
  reportContentRecommendations: z.string().describe('AI-generated recommendations for the report content, formatted as a markdown list.'),
  reportFormattingRecommendations: z.string().describe('AI-generated recommendations for the report formatting, formatted as a markdown list.'),
});
export type GenerateReportRecommendationsOutput = z.infer<typeof GenerateReportRecommendationsOutputSchema>;

export async function generateReportRecommendations(
  input: GenerateReportRecommendationsInput
): Promise<GenerateReportRecommendationsOutput> {
  return generateReportRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportRecommendationsPrompt',
  input: {schema: GenerateReportRecommendationsInputSchema},
  output: {schema: GenerateReportRecommendationsOutputSchema},
  prompt: `You are an AI assistant specializing in generating report recommendations for supervisors.

  Analyze the provided petty cash records and scanning progress records to recommend content and formatting for a comprehensive report.

  Petty Cash Records: {{{pettyCashRecords}}}
  Scanning Progress Records: {{{scanningProgressRecords}}}

  Based on these records, provide specific recommendations for:
  1. Report Content: Key insights, trends, and significant findings that should be included in the report.
  2. Report Formatting: Suggestions for organizing the report, including sections, tables, charts, and other visual aids.

  Ensure the recommendations are clear, concise, and actionable for the administrator. Return the recommendations in a structured format that is easy to implement.
  Present your recommendations as markdown-formatted lists.
  For example:
  - First recommendation
  - Second recommendation
  - Third recommendation
  `,
});

const generateReportRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateReportRecommendationsFlow',
    inputSchema: GenerateReportRecommendationsInputSchema,
    outputSchema: GenerateReportRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
