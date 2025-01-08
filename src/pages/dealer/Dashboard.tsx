import { useEffect, useState } from "react";
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
  ShoppingCart,
  Users 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

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
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      fetchDealerProfile(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchDealerProfile = async (userId: string) => {
    try {
      const { data: dealerData, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      setDealerProfile(dealerData);
    } catch (error) {
      console.error('Error fetching dealer profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dealer profile"
      });
    } finally {
      setLoading(false);
    }
  };

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