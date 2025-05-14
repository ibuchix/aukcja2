
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { isValidRecord } from "@/utils/supabaseHelpers";

interface MainDashboardProps {
  dealerId: string;
}

const MainDashboard: React.FC<MainDashboardProps> = ({ dealerId }) => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Dashboard</CardTitle>
          <CardDescription>Dealer ID: {dealerId}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add your main dashboard content here */}
          <p>This is the main dashboard content for dealer ID: {dealerId}</p>
        </CardContent>
      </Card>
    </div>
  );
};

const LoadingDashboard = () => {
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    </div>
  );
};

const DealerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dealer, setDealer] = useState<any>(null);

  useEffect(() => {
    const fetchDealerProfile = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/auth');
          toast({
            title: "Authentication Required",
            description: "Please sign in to access your dashboard.",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase
          .from('dealers')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error("Error fetching dealer profile:", error);
          toast({
            title: "Error",
            description: "Failed to load dealer profile. Please try again.",
            variant: "destructive",
          });
          return;
        }

        if (data) {
          setDealer(data);
        } else {
          toast({
            title: "Profile Not Found",
            description: "No dealer profile found. Please complete your registration.",
            variant: "destructive", // Changed from "warning" to "destructive" as warning is not in the variant types
          });
          navigate('/auth/dealer-registration');
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: "Unexpected Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDealerProfile();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-background">
      <Link to="/" className="fixed top-6 left-6 p-2 text-gray-700 hover:text-primary transition-colors">
        <Home size={24} />
      </Link>
      {isLoading ? (
        <LoadingDashboard />
      ) : (
        dealer && isValidRecord(dealer) && 'id' in dealer ? (
          <MainDashboard dealerId={dealer.id} />
        ) : (
          <div className="p-4 text-center">
            Unable to load dealer profile. Please try again later.
          </div>
        )
      )}
    </div>
  );
};

export default DealerDashboard;
