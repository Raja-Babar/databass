
'use server';

import { sendInvitations, SendInvitationsInput, SendInvitationsOutput } from '@/ai/flows/send-whatsapp-invitation';

export async function sendWhatsAppInvitations(
  input: SendInvitationsInput
): Promise<{ success: boolean; data?: SendInvitationsOutput; error?: string }> {
  try {
    if (!input.whatsappConfig.apiKey) {
        return { success: false, error: 'WhatsApp API Key is required.' };
    }
    if(input.contacts.length === 0) {
        return { success: false, error: 'No contacts provided to send invitations to.'};
    }
    const result = await sendInvitations(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending whatsapp invitations:', error);
    return { success: false, error: 'Failed to send invitations. Please try again.' };
  }
}
