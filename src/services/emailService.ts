import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (params: SendEmailParams) => {
  console.log('Sending email with params:', params);
  
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: params,
  });

  if (error) {
    console.error('Error sending email:', error);
    throw error;
  }

  console.log('Email sent successfully:', data);
  return data;
};