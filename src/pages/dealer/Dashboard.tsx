import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { 
  Car, 
  DollarSign, 
  FileText, 
  Settings, 
  User, 
  Building2, 
  History,
  Bell,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DealerProfile {
  dealership_name: string;
  supervisor_name: string;
  license_number: string;
  verification_status: string;
  is_verified: boolean;
}

const DealerDashboard = () => {
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Verify user has dealer role
      if (session.user.user_metadata?.role !== 'dealer') {
        toast({
          title: "Access Denied",
          description: "This dashboard is only accessible to dealers",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Fetch dealer profile
      const { data: dealerData, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error || !dealerData) {
        console.error('Error fetching dealer profile:', error);
        toast({
          title: "Profile Error",
          description: "Unable to load dealer profile. Please try logging in again.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate('/auth');
        return;
      }

      console.log('Dealer profile loaded:', dealerData);
      setDealerProfile(dealerData);
      setLoading(false);
    };

    checkAuthAndProfile();
  }, [navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          Loading...
        </div>
      </div>
    );
  }

  if (!dealerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] space-y-4">
          <h2 className="text-2xl font-bold">No Dealer Profile Found</h2>
          <p className="text-subtitle-text">Please complete your registration first</p>
          <Button onClick={() => navigate('/auth')}>
            Go to Registration
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Dealer Info Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{dealerProfile?.dealership_name}</h1>
          <div className="flex items-center space-x-2 text-subtitle-text">
            <User className="w-4 h-4" />
            <span>{dealerProfile?.supervisor_name}</span>
            {dealerProfile?.is_verified && (
              <span className="bg-success/20 text-success px-2 py-1 rounded-full text-sm">
                Verified Dealer
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Button 
            className="flex items-center justify-center space-x-2 h-16"
            onClick={() => navigate('/marketplace')}
          >
            <Car className="w-5 h-5" />
            <span>Browse Vehicles</span>
          </Button>
          <Button 
            className="flex items-center justify-center space-x-2 h-16"
            variant="secondary"
            onClick={() => navigate('/dealer/bids')}
          >
            <DollarSign className="w-5 h-5" />
            <span>View My Bids</span>
          </Button>
          <Button 
            className="flex items-center justify-center space-x-2 h-16"
            variant="outline"
            onClick={() => navigate('/dealer/documents')}
          >
            <FileText className="w-5 h-5" />
            <span>Manage Documents</span>
          </Button>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Active Bids */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>Active Bids</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-subtitle-text mb-4">Track and manage your current vehicle bids</p>
              <Button 
                variant="link" 
                className="p-0"
                onClick={() => navigate('/dealer/active-bids')}
              >
                View Active Bids →
              </Button>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5 text-primary" />
                <span>Transaction History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-subtitle-text mb-4">View your past transactions and purchases</p>
              <Button 
                variant="link" 
                className="p-0"
                onClick={() => navigate('/dealer/transactions')}
              >
                View History →
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-primary" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-subtitle-text mb-4">Stay updated with important alerts</p>
              <Button 
                variant="link" 
                className="p-0"
                onClick={() => navigate('/dealer/notifications')}
              >
                View Notifications →
              </Button>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-primary" />
                <span>Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-subtitle-text mb-4">Manage your dealership details</p>
              <Button 
                variant="link" 
                className="p-0"
                onClick={() => navigate('/dealer/business-info')}
              >
                View Details →
              </Button>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span>Messages</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-subtitle-text mb-4">Communicate with sellers and buyers</p>
              <Button 
                variant="link" 
                className="p-0"
                onClick={() => navigate('/dealer/messages')}
              >
                View Messages →
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary" />
                <span>Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-subtitle-text mb-4">Configure your account preferences</p>
              <Button 
                variant="link" 
                className="p-0"
                onClick={() => navigate('/dealer/settings')}
              >
                Manage Settings →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DealerDashboard;
