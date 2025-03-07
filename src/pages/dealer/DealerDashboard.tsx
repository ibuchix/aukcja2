
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { DealerWelcomeCard } from "@/components/dealer/dashboard/DealerWelcomeCard";
import { ProfileInfoSection } from "@/components/dealer/dashboard/ProfileInfoSection";
import { StatsSection } from "@/components/dealer/dashboard/StatsSection";
import { useWelcomeDashboardData } from "@/hooks/useWelcomeDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Car, 
  DollarSign, 
  FileText, 
  Settings, 
  Building2, 
  History,
  Bell,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function DealerDashboard() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { dealerProfile, recentActivity, profileDataLoading } = useWelcomeDashboardData(user, isAuthLoading);
  const navigate = useNavigate();

  // Combined loading state
  const isLoading = isAuthLoading || profileDataLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dealer Dashboard</h1>
        
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-64 rounded-lg" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <>
            <DealerWelcomeCard 
              dealerName={dealerProfile?.supervisor_name}
              dealershipName={dealerProfile?.dealership_name}
              isLoading={false}
            />
            
            <ProfileInfoSection 
              dealerProfile={dealerProfile}
              user={user}
              isLoading={false}
            />
            
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
            
            {/* Management Cards */}
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
            
            <StatsSection recentActivity={recentActivity} />
          </>
        )}
      </div>
    </div>
  );
}
