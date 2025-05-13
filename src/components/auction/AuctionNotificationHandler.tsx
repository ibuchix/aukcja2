
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sendEmail } from "@/services/emailService";
import { useQuery } from "@tanstack/react-query";

interface AuctionNotificationHandlerProps {
  dealerId: string | null;
}

export const AuctionNotificationHandler = ({ dealerId }: AuctionNotificationHandlerProps) => {
  const { toast } = useToast();
  const [notifiedAuctions, setNotifiedAuctions] = useState<Set<string>>(new Set());
  const [notifiedBids, setNotifiedBids] = useState<Set<string>>(new Set());

  // Fetch dealer email for notifications
  const { data: dealerData } = useQuery({
    queryKey: ["dealerProfile", dealerId],
    queryFn: async () => {
      if (!dealerId) return null;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        
        return { email: session.user.email };
      } catch (error) {
        console.error("Error fetching dealer email:", error);
        return null;
      }
    },
    enabled: !!dealerId
  });

  // Function to send auction outcome email
  const sendAuctionOutcomeEmail = async (
    email: string,
    isWinner: boolean,
    carDetails: any,
    bidAmount: number
  ) => {
    if (!email) return;

    const subject = isWinner 
      ? `Congratulations! You won the auction for ${carDetails.title || 'your vehicle'}`
      : `Auction Result: ${carDetails.title || 'Vehicle Auction'}`;

    const html = isWinner
      ? `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0ea5e9;">Congratulations!</h1>
          <p>You've won the auction for: <strong>${carDetails.title || 'your vehicle'}</strong></p>
          <p>Your winning bid: <strong>$${bidAmount.toLocaleString()}</strong></p>
          <p>Our team will contact you shortly with next steps to complete your purchase.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Auto-Strada Team</p>
          </div>
        </div>
      `
      : `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0ea5e9;">Auction Result</h1>
          <p>The auction for <strong>${carDetails.title || 'your vehicle'}</strong> has ended.</p>
          <p>Unfortunately, your bid of <strong>$${bidAmount.toLocaleString()}</strong> was not the winning bid.</p>
          <p>We invite you to check out our other available vehicles or upcoming auctions.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Auto-Strada Team</p>
          </div>
        </div>
      `;

    try {
      await sendEmail({
        to: email,
        subject,
        html
      });
      console.log(`Auction outcome email sent to ${email}`);
    } catch (error) {
      console.error("Error sending auction outcome email:", error);
    }
  };

  // Handle bid results (won or lost)
  useEffect(() => {
    const handleBidResult = async (event: CustomEvent) => {
      if (!dealerId) return;
      
      const { bidId, carId, dealerId: bidDealerId, status, amount } = event.detail;
      
      // Only process if it's this dealer's bid and we haven't notified about this bid yet
      if (bidDealerId === dealerId && !notifiedBids.has(bidId)) {
        // Fetch car details
        const { data: carData, error: carError } = await supabase
          .from("cars")
          .select("*")
          .eq("id", carId)
          .single();
        
        if (carError) {
          console.error("Error fetching car details:", carError);
          return;
        }

        // Mark this bid as notified
        setNotifiedBids(prev => new Set([...prev, bidId]));
        
        if (status === 'won') {
          // Show winning notification
          toast({
            title: "🎉 Congratulations!",
            description: `You won the auction for ${carData?.title || 'vehicle'} with a bid of $${amount.toLocaleString()}`,
            variant: "default",
          });
          
          // Send winning email
          if (dealerData?.email) {
            sendAuctionOutcomeEmail(dealerData.email, true, carData || {}, amount);
          }
        } else if (status === 'lost') {
          // Show losing notification
          toast({
            title: "Auction Result",
            description: `Your bid of $${amount.toLocaleString()} for ${carData?.title || 'vehicle'} was not the winning bid`,
            variant: "default",
          });
          
          // Send losing email
          if (dealerData?.email) {
            sendAuctionOutcomeEmail(dealerData.email, false, carData || {}, amount);
          }
        }
      }
    };

    // Listen for bid result events
    window.addEventListener('bid_result', handleBidResult as EventListener);
    
    return () => {
      window.removeEventListener('bid_result', handleBidResult as EventListener);
    };
  }, [dealerId, toast, notifiedBids, dealerData]);

  // Handle auction ending events
  useEffect(() => {
    const handleAuctionEnded = async (event: CustomEvent) => {
      if (!dealerId) return;
      
      const { carId, status, currentBid } = event.detail;
      
      // Skip if we've already notified about this auction
      if (notifiedAuctions.has(carId)) return;
      
      try {
        // Check if this dealer has bids on this auction
        const { data: bidData, error: bidError } = await supabase
          .from("bids")
          .select("*")
          .eq("car_id", carId)
          .eq("dealer_id", dealerId)
          .order("created_at", { ascending: false })
          .limit(1);
        
        if (bidError) throw bidError;
        
        // If dealer has no bids on this auction, no need to notify
        if (!bidData || bidData.length === 0) return;
        
        // Fetch car details
        const { data: carData, error: carError } = await supabase
          .from("cars")
          .select("*")
          .eq("id", carId)
          .single();
        
        if (carError) throw carError;
        
        // Mark this auction as notified
        setNotifiedAuctions(prev => new Set([...prev, carId]));
        
        // Show auction ended notification
        toast({
          title: "Auction Ended",
          description: `The auction for ${carData?.title || 'vehicle'} has ended. Results will be available shortly.`,
          variant: "default",
        });
      } catch (error) {
        console.error("Error processing auction ended event:", error);
      }
    };

    // Listen for auction ended events
    window.addEventListener('auction_ended', handleAuctionEnded as EventListener);
    
    return () => {
      window.removeEventListener('auction_ended', handleAuctionEnded as EventListener);
    };
  }, [dealerId, toast, notifiedAuctions]);

  // This component doesn't render anything
  return null;
};
