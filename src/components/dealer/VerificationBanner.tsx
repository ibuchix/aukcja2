import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface VerificationBannerProps {
  dealerId: string;
}

export function VerificationBanner({ dealerId }: VerificationBannerProps) {
  const { data: dealer } = useQuery({
    queryKey: ["dealerVerification", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealers")
        .select("verification_status")
        .eq("id", dealerId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (dealer?.verification_status === 'pending') {
    return (
      <Alert variant="default" className="mb-4 bg-[#EFEFFD] border-[#4B4DED]">
        <AlertCircle className="h-4 w-4 text-[#4B4DED]" />
        <AlertTitle className="text-[#4B4DED]">Account Pending Verification</AlertTitle>
        <AlertDescription>
          Your account is currently under review. You'll be notified once verified.
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}