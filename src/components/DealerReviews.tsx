import React from "react";
import { useApprovedDealerReviews } from "@/hooks/useDealerReviews";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const DealerReviews = () => {
  const { data: reviews, isLoading } = useApprovedDealerReviews(7);
  const isMobile = useIsMobile();

  if (isLoading || !reviews || reviews.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-center text-body-text mb-10`}>
          Opinie naszych dealerów
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {reviews.map((review) => (
            <Card
              key={review.id}
              className="min-w-[300px] max-w-[340px] flex-shrink-0 snap-start"
            >
              <CardContent className="p-6 space-y-3">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        star <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>

                {/* Review text */}
                <p className="text-sm text-foreground line-clamp-4">
                  {review.review_text}
                </p>

                {/* Dealer & car info */}
                <div className="pt-2 border-t border-accent">
                  <p className="text-sm font-semibold text-foreground">
                    {review.dealer_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {review.car_title}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DealerReviews;
