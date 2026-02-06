'use server';

import { generateReportRecommendations, GenerateReportRecommendationsInput, GenerateReportRecommendationsOutput } from '@/ai/flows/generate-report-recommendations';

export async function getReportRecommendations(
  input: GenerateReportRecommendationsInput
): Promise<{ success: boolean; data?: GenerateReportRecommendationsOutput; error?: string }> {
  try {
    // Basic validation to ensure inputs are valid JSON
    JSON.parse(input.pettyCashRecords);
    JSON.parse(input.scanningProgressRecords);
  } catch (e) {
    console.error('Invalid JSON input:', e);
    return { success: false, error: 'Invalid data format. Please provide valid JSON.' };
  }

  try {
    const recommendations = await generateReportRecommendations(input);
    return { success: true, data: recommendations };
  } catch (error) {
    console.error('Error generating report recommendations:', error);
    return { success: false, error: 'Failed to generate recommendations. Please try again.' };
  }
}
