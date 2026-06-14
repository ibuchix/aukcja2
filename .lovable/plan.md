
# Subscription-Based Seller Contact Access

Pivot from the current pay-per-win platform fee model to a monthly subscription. While a dealer's subscription is active, they can view seller first name, email, and phone number on any **live** auction. Existing platform fee / won-vehicle flows are disabled (kept in code, hidden in UI) so we can revert if needed.

## Scope

### 1. Database
New migration adds:
- `dealer_subscriptions` table: `id`, `dealer_id` (FK → `dealers.id`), `stripe_customer_id`, `stripe_subscription_id`, `status` (`active`, `past_due`, `canceled`, `incomplete`), `current_period_end timestamptz`, `cancel_at_period_end bool`, timestamps. Unique on `dealer_id`.
- Standard `GRANT`s (`authenticated` SELECT own row, `service_role` ALL) + RLS: dealer can read only their own row; only `service_role` (webhook) can write.
- Security-definer function `public.dealer_has_active_subscription(_user_id uuid) returns boolean` — checks `status='active' AND current_period_end > now()`. Used by RLS and by a server-side view to gate seller contact.
- New view `public.live_auction_sellers` (security_invoker=on) joining `cars` + `sellers` + `auth.users.email`, exposing `car_id, seller_first_name, seller_email, seller_phone`, but only for rows where the car has an active auction schedule (live) AND `dealer_has_active_subscription(auth.uid())`. RLS on base `sellers` continues to deny direct access.
- Index on `dealer_subscriptions(stripe_subscription_id)` for webhook lookups.

### 2. Stripe (reuses existing keys, no new secrets)
- New edge function `create-subscription-checkout`: creates a Stripe Customer (idempotent by dealer), creates a Checkout Session in `mode: 'subscription'` with one recurring price (999 PLN net/month) + explicit 23% VAT handling consistent with `mem://payments/stripe/vat-handling`. Success URL → `/dealer/subscription?status=success`.
- New edge function `stripe-subscription-webhook` (verify_jwt=false, signature verified) handling `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` → upserts `dealer_subscriptions` using `SERVICE_ROLE_KEY`. Add `STRIPE_WEBHOOK_SECRET` only if not already present (user will set the webhook URL in Stripe dashboard — we'll surface the URL).
- New edge function `cancel-subscription`: authenticated dealer call → `stripe.subscriptions.update(..., { cancel_at_period_end: true })`. (Immediate-lock requirement is enforced by the `current_period_end` check + the webhook on `customer.subscription.deleted`; "immediate lock" per the answers means access disappears as soon as `status` flips away from `active`.)

### 3. Frontend
- New hook `useDealerSubscription()` → reads `dealer_subscriptions` for current dealer; exposes `isActive`, `periodEnd`, `cancelAtPeriodEnd`.
- New page `/dealer/subscription`: shows current state, "Subskrybuj 999 PLN/mies. + VAT" CTA → invokes `create-subscription-checkout`, and "Anuluj subskrypcję" → `cancel-subscription`. Handles `?status=success` toast.
- Gate seller contact UI: in `CarDetailsDialog` and the full car-auction page, replace the existing "pay platform fee to unlock" block with:
  - If subscription active **and** auction is live → query `live_auction_sellers` view and render first name / email / phone (tel: and mailto: links).
  - Otherwise → show "Subskrybuj, aby zobaczyć dane kontaktowe sprzedawcy" with a link to `/dealer/subscription`.
- Hide (do not delete) the platform-fee UI on `WonVehicles` and any "unlock seller details" buttons. Keep underlying components/files so we can revert.
- Add subscription status indicator + link in dealer dashboard header.

### 4. Disable old per-win flow (reversible)
- Stop creating `dealer_won_vehicles` rows on auction end? Per the project knowledge the won-vehicle record is created at auction end and that logic stays — we only stop charging for it and stop using `seller_details_unlocked` for visibility. The flag is ignored by the new view; existing rows are untouched.
- Remove platform-fee CTAs from the dealer UI but leave `create-platform-fee-payment` / `verify-payment-status` functions deployed and unreferenced.

### 5. Security considerations
- Seller PII (email, phone, full name) currently lives in `sellers` + `auth.users`. The new view is the ONLY path that exposes them to dealers, gated by:
  1. RLS on `dealer_subscriptions` (dealer can't fake their own status — only webhook writes).
  2. `dealer_has_active_subscription` is `security definer` reading `dealer_subscriptions` by `auth.uid()`.
  3. View filters to live auctions only, so ended/scheduled auctions don't leak.
  4. Base `sellers` table SELECT policy remains restrictive; no direct SELECT for dealers.
- Stripe webhook requires signature verification — never trust unsigned payloads.
- `cancel-subscription` must verify `auth.uid()` owns the dealer record before calling Stripe.
- Audit log entry written on each contact view (insert into existing `audit_logs`) for misuse traceability.
- Rate-limit seller-contact view queries per dealer to discourage scraping (reuse `dealer_bid_rate_limits` pattern or add new bucket).
- Update `mem://security/data/seller-contact-protection` after rollout to reflect the new gating rule.

## Open items to confirm
1. Stripe **Price ID** for the 999 PLN/mo product — should I create it dynamically in code (price_data on checkout) or do you want a fixed Price ID configured as a secret?
2. Webhook endpoint setup: I can deploy the function and tell you the URL to register in Stripe → that yields a `STRIPE_WEBHOOK_SECRET` you'd paste back. OK to proceed that way?
3. "Live auction only" — should subscribers also see contact on auctions that have ended in the last X hours (e.g., to follow up), or strictly only while the schedule status is live?

## Out of scope
- Refunds/proration for in-flight subscriptions.
- Tiered plans, annual billing, team seats.
- Deletion of historical `dealer_won_vehicles` / platform-fee data.
