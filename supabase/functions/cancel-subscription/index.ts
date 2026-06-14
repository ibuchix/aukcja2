import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");

    const anon = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await anon.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: sub, error } = await admin
      .from("dealer_subscriptions")
      .select("stripe_subscription_id, user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !sub?.stripe_subscription_id) throw new Error("Brak aktywnej subskrypcji");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await admin
      .from("dealer_subscriptions")
      .update({
        cancel_at_period_end: true,
        status: updated.status,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ success: true, cancel_at_period_end: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("cancel-subscription error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});