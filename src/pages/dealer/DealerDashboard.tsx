
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  User, 
  Building2, 
  FileText, 
  Car, 
  Clock, 
  Activity 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DealerDashboard() {
  const { profile, user, isLoading } = useAuth();
  const [recentActivity, setRecentActivity] = useState<boolean>(false);

  useEffect(() => {
    // Set a timeout to simulate loading recent activity
    const timer = setTimeout(() => {
      setRecentActivity(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dealer Dashboard</h1>
        
        {/* Welcome Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome, {isLoading ? <Skeleton className="h-6 w-32" /> : profile?.supervisor_name || "Dealer"}</CardTitle>
            <CardDescription>
              This is your personal dashboard where you can manage your dealer activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              You can browse and bid on vehicles, manage your profile, and track your auctions from here.
            </p>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Dealer Information Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <User className="mr-2 h-5 w-5 text-primary" />
                Dealer Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {profile?.supervisor_name || "Not available"}</p>
                  <p><span className="font-medium">Email:</span> {user?.email || "Not available"}</p>
                  <p><span className="font-medium">Verification:</span> {profile?.is_verified ? "Verified" : "Pending Verification"}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Company Information Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Building2 className="mr-2 h-5 w-5 text-primary" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <div className="space-y-2">
                  <p><span className="font-medium">Dealership:</span> {profile?.dealership_name || "Not available"}</p>
                  <p><span className="font-medium">Address:</span> {profile?.address || "Not available"}</p>
                  <p><span className="font-medium">License:</span> {profile?.license_number || "Not available"}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Additional Details Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="space-y-2">
                  <p><span className="font-medium">Tax ID:</span> {profile?.tax_id || "Not available"}</p>
                  <p><span className="font-medium">Business Registry:</span> {profile?.business_registry_number || "Not available"}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Stats Cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Car className="mr-2 h-5 w-5 text-primary" />
                Active Auctions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-muted-foreground text-sm">Auctions you're participating in</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Clock className="mr-2 h-5 w-5 text-primary" />
                Watchlist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <p className="text-muted-foreground text-sm">Vehicles you're watching</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Activity className="mr-2 h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!recentActivity ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <p className="text-muted-foreground">No recent activity to show</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
