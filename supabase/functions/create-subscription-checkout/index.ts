import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHLY_NET_PLN = 999;
const VAT_RATE = 0.23;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!stripeKey || !supabaseUrl || !anonKey || !serviceKey) {
      throw new Error("Server configuration missing");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");

    const anon = createClient(supabaseUrl, anonKey);
    const { data: userData, error: userErr } = await anon.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const admin = createClient(supabaseUrl, serviceKey);

    // Find dealer record for this user
    const { data: dealer, error: dealerErr } = await admin
      .from("dealers")
      .select("id, user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (dealerErr || !dealer) throw new Error("Dealer profile not found");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Reuse existing customer if we have one
    const { data: existing } = await admin
      .from("dealer_subscriptions")
      .select("stripe_customer_id, status")
      .eq("dealer_id", dealer.id)
      .maybeSingle();

    if (existing?.status === "active") {
      return new Response(
        JSON.stringify({ error: "Subskrypcja jest już aktywna." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let customerId = existing?.stripe_customer_id ?? undefined;
    if (!customerId && user.email) {
      const found = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = found.data[0]?.id;
    }

    const origin = req.headers.get("origin") ?? "";
    const netGrosze = Math.round(MONTHLY_NET_PLN * 100);
    const vatGrosze = Math.round(MONTHLY_NET_PLN * VAT_RATE * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "pln",
            unit_amount: netGrosze,
            recurring: { interval: "month" },
            product_data: {
              name: "Subskrypcja Autaro – dostęp do danych sprzedawców",
              description: "Miesięczny dostęp do danych kontaktowych sprzedawców w aktywnych aukcjach.",
            },
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "pln",
            unit_amount: vatGrosze,
            recurring: { interval: "month" },
            product_data: {
              name: "VAT 23%",
              description: "Podatek VAT 23% od subskrypcji",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dealer/subscription?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dealer/subscription?status=cancelled`,
      metadata: {
        dealer_id: dealer.id,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          dealer_id: dealer.id,
          user_id: user.id,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("create-subscription-checkout error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});