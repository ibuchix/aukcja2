

# Add 23% Polish VAT to Platform Fee Payments

## Current Setup

The payment flow works like this:
1. Frontend calls `create-platform-fee-payment` edge function with `vehicleId` and `platformFee` (net amount from the fee table)
2. The edge function creates a Stripe Checkout session with `unit_amount = platformFee * 100` (grosze)
3. Dealer pays exactly the platform fee -- **no VAT is currently added**

## Approach: Stripe's Built-in `automatic_tax`

Rather than manually calculating 23% and adding a second line item, we'll use **Stripe's `automatic_tax` feature**. This is the cleanest approach because:
- Stripe handles the tax calculation, line item display, and receipt/invoice formatting
- The checkout page shows the tax breakdown clearly to the dealer
- It's compliant and future-proof (if tax rates change, Stripe updates them)

### Pre-requisite: One-time Stripe Dashboard Setup

Before the code change works, you need to do this once in your Stripe Dashboard:

1. Go to **Settings > Tax** in your Stripe Dashboard
2. **Add a tax registration** for Poland (PL) with VAT 23%
3. Set your **origin address** to your Polish business address
4. Enable **Stripe Tax**

This is a one-time setup -- without it, `automatic_tax` will return an error.

## Code Changes

### File 1: `supabase/functions/create-platform-fee-payment/index.ts`

Add two things to the Stripe Checkout session creation:

1. **`automatic_tax: { enabled: true }`** -- tells Stripe to calculate VAT
2. **`tax_code: "txcd_10000000"`** on the product data -- this is Stripe's general services tax code (appropriate for platform/service fees)
3. **`tax_behavior: "exclusive"`** on the price data -- means the 23% VAT is added ON TOP of the platform fee (so if fee is 800 PLN, dealer pays 800 + 184 = 984 PLN)

```typescript
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  customer_email: customerId ? undefined : userData.user.email,
  line_items: [
    {
      price_data: {
        currency: "pln",
        product_data: {
          name: productName,
          description: productDescription,
          tax_code: "txcd_10000000",  // General services
        },
        unit_amount: Math.round(platformFee * 100),
        tax_behavior: "exclusive",  // VAT added on top
      },
      quantity: 1,
    },
  ],
  automatic_tax: { enabled: true },  // Enable Stripe Tax
  mode: "payment",
  // ... rest stays the same
});
```

### File 2: `src/pages/Pricing.tsx` (optional but recommended)

Add a note below the fee table that all prices are net (netto) and 23% VAT will be added at checkout:

```
Wszystkie podane kwoty są kwotami netto. Do opłaty zostanie doliczony podatek VAT 23%.
```

### File 3: `src/utils/platformFeeCalculator.ts`

No changes needed -- the fee tiers remain as net amounts.

## What the Dealer Will See

At Stripe Checkout, instead of just "Platform Fee - 800 PLN", they'll see:

```
Platform Fee - Vehicle Purchase     800,00 PLN
VAT (23%)                           184,00 PLN
─────────────────────────────────────────────
Total                               984,00 PLN
```

## What Won't Break

- The `platformFee` value passed from frontend to edge function stays the same (net amount)
- The `verify-payment-status` function doesn't care about amounts, only payment status -- no changes needed
- The `dealer_won_vehicles.platform_fee` column still stores the net fee -- unchanged
- The `process-specific-auctions` function calculates and stores the net fee -- unchanged
- All existing payment flows, success/cancel URLs, and metadata remain identical

## Summary of Changes

| File | Change |
|------|--------|
| `create-platform-fee-payment/index.ts` | Add `automatic_tax`, `tax_code`, `tax_behavior` |
| `src/pages/Pricing.tsx` | Add VAT disclaimer note |

## Required Manual Step

You must enable Stripe Tax and register for Polish VAT in your Stripe Dashboard **before** deploying this change. Without that, the checkout will fail with a tax configuration error.

