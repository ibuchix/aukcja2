
import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (params: SendEmailParams) => {
  console.log('Sending email with params:', params);
  
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception in sendEmail:', error);
    throw error;
  }
};

export const sendDealerWelcomeEmail = async (name: string, email: string) => {
  console.log(`Sending welcome email to dealer: ${name} (${email})`);
  
  try {
    const { data, error } = await supabase.functions.invoke('send-dealer-welcome', {
      body: {
        name,
        email,
      },
    });

    if (error) {
      console.error('Error sending dealer welcome email:', error);
      throw error;
    }

    console.log('Dealer welcome email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception sending dealer welcome email:', error);
    // Don't fail the entire registration process if email fails
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
