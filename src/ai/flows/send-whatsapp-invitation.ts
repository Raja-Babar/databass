
'use server';
/**
 * @fileOverview An AI agent for sending WhatsApp invitations.
 *
 * - sendInvitations - A function that handles generating and "sending" WhatsApp invitations.
 * - SendInvitationsInput - The input type for the sendInvitations function.
 * - SendInvitationsOutput - The return type for the sendInvitations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContactSchema = z.object({
  name: z.string(),
  phone: z.string(),
});

const ProgramDetailsSchema = z.object({
    programTopic: z.string(),
    programDate: z.string(),
    programTime: z.string(),
    address: z.string(),
    organizer: z.string(),
    phone: z.string(),
    email: z.string(),
    programTopicSindhi: z.string(),
    programDateSindhi: z.string(),
    programTimeSindhi: z.string(),
    addressSindhi: z.string(),
    organizerSindhi: z.string(),
    phoneSindhi: z.string(),
    emailSindhi: z.string(),
});

const WhatsappConfigSchema = z.object({
    apiKey: z.string().describe('The API key for the WhatsApp service.'),
    adminPhoneNumber: z.string().describe('The admin\'s WhatsApp phone number for sending messages.'),
});


const SendInvitationsInputSchema = z.object({
  programDetails: ProgramDetailsSchema,
  contacts: z.array(ContactSchema),
  whatsappConfig: WhatsappConfigSchema,
});
export type SendInvitationsInput = z.infer<typeof SendInvitationsInputSchema>;

const SendInvitationsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  sentCount: z.number(),
  failedCount: z.number(),
});
export type SendInvitationsOutput = z.infer<typeof SendInvitationsOutputSchema>;


export async function sendInvitations(input: SendInvitationsInput): Promise<SendInvitationsOutput> {
  return sendInvitationsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateInvitationMessagePrompt',
  input: {schema: ProgramDetailsSchema},
  output: {schema: z.string().describe("The generated invitation message. It should be bilingual (English and Sindhi), polite, and informative. Include all program details.")},
  prompt: `You are an assistant responsible for creating event invitations.
  Generate a polite and clear WhatsApp invitation message for a program.
  The message must be bilingual (English and Sindhi).
  Include all the details of the program provided below.

  English Details:
  - Topic: {{{programTopic}}}
  - Date: {{{programDate}}}
  - Time: {{{programTime}}}
  - Address: {{{address}}}
  - Organizer: {{{organizer}}}
  - Phone: {{{phone}}}
  - Email: {{{email}}}

  Sindhi Details:
  - موضوع: {{{programTopicSindhi}}}
  - تاريخ: {{{programDateSindhi}}}
  - وقت: {{{programTimeSindhi}}}
  - پتو: {{{addressSindhi}}}
  - منتظم: {{{organizerSindhi}}}
  - فون: {{{phoneSindhi}}}
  - اي ميل: {{{emailSindhi}}}

  The message should be well-formatted for WhatsApp.
  Start with a polite greeting. End with a closing remark.
  `,
});

const sendInvitationsFlow = ai.defineFlow(
  {
    name: 'sendInvitationsFlow',
    inputSchema: SendInvitationsInputSchema,
    outputSchema: SendInvitationsOutputSchema,
  },
  async (input) => {
    const { programDetails, contacts, whatsappConfig } = input;
    
    // Step 1: Generate the invitation message using an AI prompt
    const { output: invitationMessage } = await prompt(programDetails);

    if (!invitationMessage) {
        return {
            success: false,
            message: "Failed to generate invitation message.",
            sentCount: 0,
            failedCount: contacts.length,
        };
    }

    // Step 2: "Send" the message to each contact.
    // In a real application, this would involve calling a WhatsApp API.
    // Here, we will just simulate the process.
    console.log(`Using WhatsApp API Key: ${whatsappConfig.apiKey.substring(0,5)}...`);
    console.log("Generated Message:\n", invitationMessage);

    let sentCount = 0;
    for (const contact of contacts) {
      console.log(`Simulating sending message to ${contact.name} at ${contact.phone}`);
      // Simulate a successful send
      sentCount++;
    }

    return {
      success: true,
      message: `Successfully sent ${sentCount} invitations.`,
      sentCount,
      failedCount: 0,
    };
  }
);
    
