
import React from "react";
import { CarSearchContent } from "./CarSearchContent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CarSearchErrorDisplay } from "./status/CarSearchErrorDisplay";
import { useNavigate } from "react-router-dom";
import { useDealerProfileSimple } from "@/hooks/useDealerProfileSimple";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";

interface CarSearchProps {
  dealerId?: string;
}

export const CarSearch = ({ dealerId }: CarSearchProps) => {
  const navigate = useNavigate();
  const { dealerProfile, isLoading } = useDealerProfileSimple();

  // If no dealer ID provided, show error
  if (!dealerId) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6">
          <CarSearchErrorDisplay 
            errorMessage="Please complete your dealer profile to access live auctions."
            onRefresh={() => navigate("/complete-registration")}
          />
        </CardContent>
      </Card>
    );
  }

  // Show loading state while checking verification
  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Loading dealer verification status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show verification required message if dealer is not verified
  if (dealerProfile && !dealerProfile.is_verified) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6">
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-red-800 space-y-4">
              <div>
                <strong>Dealer Verification Required</strong>
              </div>
              <p>
                Only verified dealers can view live auctions and place bids. 
                Your dealer account needs to be verified before you can access the auction marketplace.
              </p>
              <Button 
                onClick={() => navigate("/dealer/profile")} 
                variant="outline" 
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                View Profile Status
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show the live auction search for verified dealers
  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <CarSearchContent dealerId={dealerId} />
      </CardContent>
    </Card>
  );
};
