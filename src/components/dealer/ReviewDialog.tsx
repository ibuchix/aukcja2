import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubmitDealerReview } from "@/hooks/useDealerReviews";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealerId: string;
  carId: string;
  dealerName: string;
  carTitle: string;
}

export const ReviewDialog = ({
  open,
  onOpenChange,
  dealerId,
  carId,
  dealerName,
  carTitle,
}: ReviewDialogProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const submitReview = useSubmitDealerReview();

  const wordCount = reviewText.trim() ? reviewText.trim().split(/\s+/).length : 0;
  const isValid = rating >= 1 && reviewText.trim().length > 0 && wordCount <= 300;

  const handleSubmit = () => {
    if (!isValid) return;
    submitReview.mutate(
      { dealerId, carId, rating, reviewText: reviewText.trim(), dealerName, carTitle },
      { onSuccess: () => { onOpenChange(false); setRating(0); setReviewText(""); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Oceń transakcję</DialogTitle>
          <DialogDescription>{carTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Star Rating */}
          <div>
            <p className="text-sm font-medium mb-2">Twoja ocena</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition-colors",
                      (hoverRating || rating) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <p className="text-sm font-medium mb-2">Twoja recenzja</p>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Opisz swoje doświadczenie z tą transakcją..."
              className="min-h-[120px]"
            />
            <p className={cn("text-xs mt-1", wordCount > 300 ? "text-destructive" : "text-muted-foreground")}>
              {wordCount}/300 słów
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitReview.isPending}>
            {submitReview.isPending ? "Wysyłanie..." : "Wyślij recenzję"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
