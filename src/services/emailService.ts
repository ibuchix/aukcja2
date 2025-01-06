import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async (params: SendEmailParams) => {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: params,
  });

  if (error) {
    console.error('Error sending email:', error);
    throw error;
  }

  return data;
};