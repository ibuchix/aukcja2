import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DealerProfile {
  dealership_name: string;
  address?: string | null;
  license_number: string;
}

interface DealerHeaderProps {
  dealerId: string;
}

export function DealerHeader({ dealerId }: DealerHeaderProps) {
  const { data: dealerProfile, isLoading } = useQuery({
    queryKey: ["dealerProfile", dealerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealers")
        .select("dealership_name, address, license_number")
        .eq("id", dealerId)
        .single();

      if (error) throw error;
      return data as DealerProfile;
    },
  });

  if (isLoading || !dealerProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">{dealerProfile.dealership_name}</h1>
      <div className="flex items-center space-x-2 text-subtitle-text">
        {dealerProfile.address && (
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{dealerProfile.address}</span>
          </div>
        )}
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-1" />
          <span>License: {dealerProfile.license_number}</span>
        </div>
      </div>
    </div>
  );
}