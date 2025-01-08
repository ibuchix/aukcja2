import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Car, 
  DollarSign, 
  FileText, 
  Settings, 
  User, 
  Building2, 
  History,
  Bell,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface DealerProfile {
  dealership_name: string;
  supervisor_name: string;
  license_number: string;
  verification_status: string;
  is_verified: boolean;
}

export default function DealerProfile() {
  const [dealerProfile, setDealerProfile] = useState<DealerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDealerProfile();
  }, []);

  const fetchDealerProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data: dealerData, error } = await supabase
        .from('dealers')
        .select('*')
        .eq('user_id', session.user.id)
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
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dealer Info Header */}
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
          onClick={() => navigate('/dealer/bids')}
          variant="secondary"
        >
          <DollarSign className="w-5 h-5" />
          <span>View My Bids</span>
        </Button>
        <Button 
          className="flex items-center justify-center space-x-2 h-16"
          onClick={() => navigate('/dealer/documents')}
          variant="outline"
        >
          <FileText className="w-5 h-5" />
          <span>Manage Documents</span>
        </Button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Bids */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span>Active Bids</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
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
  );
}