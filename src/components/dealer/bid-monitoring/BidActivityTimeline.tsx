
import { format } from "date-fns";
import { BidActivity } from "./types";
import { Gavel, ArrowUp, ArrowDown, Clock, Trophy, Ban } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface BidActivityTimelineProps {
  activities: BidActivity[];
  isLoading: boolean;
}

export const BidActivityTimeline = ({ activities, isLoading }: BidActivityTimelineProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid Activity</CardTitle>
          <CardDescription>Loading activity...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (!activities.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-heading-md font-kanit font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Bid Activity Timeline
          </CardTitle>
          <CardDescription>
            Your recent bidding activity will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">
            <Gavel className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No Bid Activity</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Start bidding on auctions to see your activity here.
            </p>
            <Button asChild className="mt-4">
              <Link to="/auctions">Browse Auctions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const getActivityIcon = (activity: BidActivity) => {
    switch (activity.type) {
      case 'new_bid':
        return <Gavel className="h-5 w-5 text-primary" />;
      case 'outbid':
        return <ArrowDown className="h-5 w-5 text-amber-500" />;
      case 'won':
        return <Trophy className="h-5 w-5 text-green-500" />;
      case 'lost':
        return <Ban className="h-5 w-5 text-destructive" />;
      case 'auction_ended':
        return <Clock className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Gavel className="h-5 w-5" />;
    }
  };
  
  const getActivityTitle = (activity: BidActivity) => {
    switch (activity.type) {
      case 'new_bid':
        return activity.isOwnActivity 
          ? "You placed a bid" 
          : `New bid by ${activity.dealerName || "a dealer"}`;
      case 'outbid':
        return activity.isOwnActivity 
          ? "You were outbid" 
          : `${activity.dealerName || "A dealer"} was outbid`;
      case 'won':
        return activity.isOwnActivity 
          ? "You won an auction!" 
          : `${activity.dealerName || "A dealer"} won the auction`;
      case 'lost':
        return activity.isOwnActivity 
          ? "You lost an auction" 
          : `${activity.dealerName || "A dealer"} lost the auction`;
      case 'auction_ended':
        return "Auction ended";
      default:
        return "Bid activity";
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-heading-md font-kanit font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Bid Activity Timeline
        </CardTitle>
        <CardDescription>
          Your recent bidding activity in chronological order
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.map((activity) => (
            <div key={activity.id} className="relative pl-6 pb-8 border-l border-muted last:pb-0">
              <div className="absolute left-0 -translate-x-1/2 transform">
                <div className="bg-card border-2 border-primary rounded-full p-1">
                  {getActivityIcon(activity)}
                </div>
              </div>
              
              <div className="mb-1 text-sm text-muted-foreground">
                {format(new Date(activity.timestamp), "MMM d, yyyy HH:mm")}
              </div>
              
              <div className="font-medium">
                {getActivityTitle(activity)}
              </div>
              
              <div className="mt-1">
                <Link to={`/auctions/${activity.carId}`} className="text-primary hover:underline">
                  {activity.carTitle}
                </Link>
                {activity.bidAmount && (
                  <span className="ml-2 font-medium">${activity.bidAmount.toLocaleString()}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
