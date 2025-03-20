
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBidRecommendations } from "@/hooks/useBidCalculations";
import { formatCurrency } from "@/lib/utils";

interface BidRecommendationsProps {
  carId: string;
  dealerId: string;
  onSelectRecommendation?: (amount: number) => void;
}

export const BidRecommendations = ({ 
  carId, 
  dealerId,
  onSelectRecommendation 
}: BidRecommendationsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: recommendations, isLoading, error } = useBidRecommendations(carId, dealerId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Bid Recommendations
          </CardTitle>
          <CardDescription>
            Smart suggestions to help you bid effectively
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-heading-sm font-oswald flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Bid Recommendations
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto h-8 w-8 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
        <CardDescription>
          Smart suggestions to help you bid effectively
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex flex-col items-center justify-center h-auto py-3"
              onClick={() => onSelectRecommendation?.(recommendations.recommendations.conservative)}
            >
              <span className="text-xs text-muted-foreground mb-1">Conservative</span>
              <span className="text-lg font-bold">{formatCurrency(recommendations.recommendations.conservative)}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex flex-col items-center justify-center h-auto py-3 border-primary"
              onClick={() => onSelectRecommendation?.(recommendations.recommendations.moderate)}
            >
              <span className="text-xs text-muted-foreground mb-1">Recommended</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(recommendations.recommendations.moderate)}</span>
              <Sparkles className="h-3 w-3 text-primary mt-1" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex flex-col items-center justify-center h-auto py-3"
              onClick={() => onSelectRecommendation?.(recommendations.recommendations.aggressive)}
            >
              <span className="text-xs text-muted-foreground mb-1">Aggressive</span>
              <span className="text-lg font-bold">{formatCurrency(recommendations.recommendations.aggressive)}</span>
            </Button>
          </div>
          
          {isExpanded && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Current Bid</span>
                <span className="font-semibold">{formatCurrency(recommendations.current_bid)}</span>
              </div>
              
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Average Bid Increase</span>
                <span className="font-semibold">{formatCurrency(recommendations.average_bid_increase)}</span>
              </div>
              
              {recommendations.similar_car_average_price && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Similar Cars Average</span>
                  <span className="font-semibold">{formatCurrency(recommendations.similar_car_average_price)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Reserve Met</span>
                <span className={`font-semibold ${recommendations.reserve_met ? 'text-green-500' : 'text-amber-500'}`}>
                  {recommendations.reserve_met ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="mt-4 text-xs text-muted-foreground">
                <p>Our AI analyzes similar vehicles, bidding patterns, and market trends to recommend optimal bid amounts.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
