import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DealerSubscriptionState {
  isActive: boolean;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useDealerSubscription(): DealerSubscriptionState {
  const { user } = useAuth();
  const [data, setData] = useState<{
    status: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    stripeSubscriptionId: string | null;
  }>({
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    stripeSubscriptionId: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data: row } = await supabase
      .from("dealer_subscriptions")
      .select("status, current_period_end, cancel_at_period_end, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();
    setData({
      status: row?.status ?? null,
      currentPeriodEnd: row?.current_period_end ?? null,
      cancelAtPeriodEnd: row?.cancel_at_period_end ?? false,
      stripeSubscriptionId: row?.stripe_subscription_id ?? null,
    });
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const isActive =
    data.status === "active" &&
    !!data.currentPeriodEnd &&
    new Date(data.currentPeriodEnd).getTime() > Date.now();

  return {
    isActive,
    status: data.status,
    currentPeriodEnd: data.currentPeriodEnd,
    cancelAtPeriodEnd: data.cancelAtPeriodEnd,
    stripeSubscriptionId: data.stripeSubscriptionId,
    isLoading,
    refresh: load,
  };
}