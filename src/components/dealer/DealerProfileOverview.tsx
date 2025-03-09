
import { User } from "@supabase/supabase-js";
import { DealerRecord } from "@/utils/databaseTypes";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, Building, MapPin, Phone, Tag, FileText, BadgeCheck, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface DealerProfileOverviewProps {
  dealerProfile: DealerRecord | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function DealerProfileOverview({ 
  dealerProfile, 
  user, 
  isLoading,
  error 
}: DealerProfileOverviewProps) {
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error && !dealerProfile) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Profile Error
          </CardTitle>
          <CardDescription>
            We encountered an issue loading your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {error.includes("profile found") 
              ? "We couldn't find your dealer profile. You may need to complete your registration."
              : "There was an error loading your profile. Please try refreshing the page."}
          </p>
          {error.includes("profile found") ? (
            <Button asChild size="sm">
              <Link to="/complete-registration">Complete Registration</Link>
            </Button>
          ) : (
            <Button onClick={() => window.location.reload()} size="sm">
              Refresh Page
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // No profile but no error - should not happen but handling just in case
  if (!dealerProfile && !error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Profile Not Found</CardTitle>
          <CardDescription>
            We couldn't find your dealer profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Please complete your registration to access all dealer features.
          </p>
          <Button asChild size="sm">
            <Link to="/complete-registration">Complete Registration</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render profile data
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{dealerProfile?.dealership_name}</span>
          {dealerProfile?.is_verified ? (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center">
              <BadgeCheck className="h-3 w-3 mr-1" />
              Verified
            </span>
          ) : (
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {dealerProfile?.verification_status || "Pending"}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Dealer Account managed by {dealerProfile?.supervisor_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start">
          <Building className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Company Information</p>
            <p className="text-sm text-muted-foreground">{dealerProfile?.dealership_name}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Address</p>
            <p className="text-sm text-muted-foreground">{dealerProfile?.address || "Not provided"}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <Tag className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Tax ID</p>
            <p className="text-sm text-muted-foreground">{dealerProfile?.tax_id || "Not provided"}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <FileText className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Business Registry</p>
            <p className="text-sm text-muted-foreground">{dealerProfile?.business_registry_number || "Not provided"}</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <CalendarClock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Registration Date</p>
            <p className="text-sm text-muted-foreground">
              {dealerProfile?.created_at 
                ? new Date(dealerProfile.created_at).toLocaleDateString() 
                : "Unknown"}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link to="/dealer/profile">
            Manage Profile
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
