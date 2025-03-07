
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  History, 
  Bell, 
  Building2, 
  MessageSquare, 
  Settings 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ManagementCards = () => {
  const navigate = useNavigate();
  
  return (
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
  );
};
