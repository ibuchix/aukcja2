import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDealerCarReview = (dealerId: string | undefined, carId: string) => {
  return useQuery({
    queryKey: ["dealerReview", dealerId, carId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("dealer_reviews" as any)
        .select("id, rating, status") as any)
        .eq("dealer_id", dealerId!)
        .eq("car_id", carId)
        .maybeSingle();

      if (error) throw error;
      return data as { id: string; rating: number; status: string } | null;
    },
    enabled: !!dealerId && !!carId,
  });
};

export const useSubmitDealerReview = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dealerId,
      carId,
      rating,
      reviewText,
      dealerName,
      carTitle,
    }: {
      dealerId: string;
      carId: string;
      rating: number;
      reviewText: string;
      dealerName: string;
      carTitle: string;
    }) => {
      const { data, error } = await supabase
        .from("dealer_reviews" as any)
        .insert({
          dealer_id: dealerId,
          car_id: carId,
          rating,
          review_text: reviewText,
          dealer_name: dealerName,
          car_title: carTitle,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast({ description: "Recenzja została wysłana do zatwierdzenia!" });
      queryClient.invalidateQueries({ queryKey: ["dealerReview", variables.dealerId, variables.carId] });
      queryClient.invalidateQueries({ queryKey: ["approvedDealerReviews"] });
    },
    onError: () => {
      toast({ description: "Nie udało się wysłać recenzji. Spróbuj ponownie.", variant: "destructive" });
    },
  });
};

export const useApprovedDealerReviews = (limit = 7) => {
  return useQuery({
    queryKey: ["approvedDealerReviews", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dealer_reviews" as any)
        .select("id, rating, review_text, dealer_name, car_title, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as any[]) || [];
    },
  });
};
