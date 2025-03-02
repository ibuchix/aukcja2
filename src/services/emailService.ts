
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

    // Handle Resend validation errors that are returned with success: false
    if (data && !data.success && data.error) {
      console.warn('Resend API warning:', data.error);
      
      // Handle domain verification issues
      if (data.error.statusCode === 403 && data.error.message?.includes('verify a domain')) {
        console.warn('Domain verification required. During testing, emails can only be sent to verified addresses.');
        return { 
          success: false, 
          error: 'Email service requires domain verification. Contact admin or verify your domain at resend.com/domains.',
          isConfigIssue: true
        };
      }
      
      return { 
        success: false, 
        error: data.error.message || 'Email service configuration issue', 
        isConfigIssue: true 
      };
    }

    console.log('Dealer welcome email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Exception sending dealer welcome email:', error);
    // Don't fail the entire registration process if email fails
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      isConfigIssue: error instanceof Error && error.message.includes('domain') 
    };
  }
};
