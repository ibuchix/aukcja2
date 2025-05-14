
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isValidRecord } from "@/utils/supabaseHelpers";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: dealer, isLoading } = useQuery({
    queryKey: ['dealerProfile'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate('/auth');
        return null;
      }

      const { data, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        console.error("Error fetching dealer profile:", error);
        return null;
      }

      return data;
    },
  });

  useEffect(() => {
    if (!isLoading && !dealer) {
      toast({
        title: "Error",
        description: "Could not load dealer profile. Please try again.",
        variant: "destructive",
      });
    }
  }, [dealer, isLoading, toast]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  // When accessing dealer data, add a type check:
  const formattedDealerData = useMemo(() => {
    if (!dealer || !isValidRecord(dealer)) return null;

    return {
      dealershipName: dealer.dealership_name || '',
      supervisorName: dealer.supervisor_name || '',
      taxId: dealer.tax_id || '',
      businessRegistryNumber: dealer.business_registry_number || '',
      address: dealer.address || '',
      licenseNumber: dealer.license_number || '',
    };
  }, [dealer]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Loading Profile...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <p>Fetching your profile details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formattedDealerData) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Profile Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load profile data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Dealer Profile</CardTitle>
          <CardDescription>View and manage your dealer profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Dealership Information</h3>
              <div className="grid gap-2">
                <div>
                  <p className="text-gray-600">Dealership Name:</p>
                  <p className="font-medium">{formattedDealerData.dealershipName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Supervisor Name:</p>
                  <p className="font-medium">{formattedDealerData.supervisorName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Business Details</h3>
              <div className="grid gap-2">
                <div>
                  <p className="text-gray-600">Tax ID:</p>
                  <p className="font-medium">{formattedDealerData.taxId}</p>
                </div>
                <div>
                  <p className="text-gray-600">Business Registry Number:</p>
                  <p className="font-medium">{formattedDealerData.businessRegistryNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Address:</p>
                  <p className="font-medium">{formattedDealerData.address}</p>
                </div>
                <div>
                  <p className="text-gray-600">License Number:</p>
                  <p className="font-medium">{formattedDealerData.licenseNumber}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="secondary" onClick={handleEditClick}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
