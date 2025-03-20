
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTour } from "@/contexts/tour/TourContext";
import { TourButton } from "@/components/tour/TourButton";
import { useIsMobile } from "@/hooks/useIsMobile";

export function DealerWelcomeCard() {
  const { user, profile } = useAuth();
  const { hasCompletedTour } = useTour();
  const isMobile = useIsMobile();
  
  // Extract dealer name from profile or fallback to email
  const dealerName = profile?.supervisor_name || user?.email?.split('@')[0] || 'Dealer';

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'justify-between items-center'}`}>
          <CardTitle className="text-2xl">
            Welcome, {dealerName}!
          </CardTitle>
          
          <TourButton>
            {hasCompletedTour ? 'Replay Tour' : 'How to Use Proxy Bidding'}
          </TourButton>
        </div>
        <CardDescription>
          Your one-stop dashboard for managing auctions and monitoring your bidding activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <p id="proxy-bidding-section" className="mb-2">
            Use our <span className="font-medium text-primary">proxy bidding system</span> to 
            automatically place bids up to your maximum amount - no need to manually bid!
          </p>
          <div className="flex items-center gap-2 mt-3 text-muted-foreground">
            <span id="increment-info">
              Bid in increments to stay competitive while never exceeding your budget.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
