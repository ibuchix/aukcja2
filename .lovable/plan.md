

# Fix: Show 23% VAT Directly Without Address Prompt

## Problem
Stripe's `automatic_tax` requires the customer to enter their address before calculating tax. Since all dealers are in Poland and the business is Polish, we don't need address-based tax calculation -- we just need a flat 23% VAT line.

## Solution
Remove `automatic_tax` and instead add the VAT as a **second line item** manually. This gives a clear breakdown without requiring any address input.

## Change: `supabase/functions/create-platform-fee-payment/index.ts`

Replace the current checkout session creation with two line items and remove `automatic_tax`:

```typescript
const vatRate = 0.23;
const vatAmount = Math.round(platformFee * vatRate * 100); // in grosze

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
        },
        unit_amount: Math.round(platformFee * 100),
      },
      quantity: 1,
    },
    {
      price_data: {
        currency: "pln",
        product_data: {
          name: "VAT 23%",
          description: "Podatek VAT 23%",
        },
        unit_amount: vatAmount,
      },
      quantity: 1,
    },
  ],
  // NO automatic_tax -- we handle it ourselves
  mode: "payment",
  allow_promotion_codes: true,
  success_url: `...same as before...`,
  cancel_url: `...same as before...`,
  metadata: { ...same as before... },
});
```

## What the Dealer Will See

```
Platform Fee - Vehicle Purchase     PLN 1,500.00
VAT 23%                            PLN   345.00
────────────────────────────────────────────────
Total due                          PLN 1,845.00
```

No address prompt. Clear breakdown. Works immediately from any country.

## What Won't Break
- Frontend code unchanged -- same `platformFee` value sent
- `verify-payment-status` checks payment status only, not amounts
- Database stores net fee -- unchanged
- Success/cancel URLs and metadata stay the same

## Summary

| Item | Detail |
|------|--------|
| File changed | `create-platform-fee-payment/index.ts` |
| Removed | `automatic_tax`, `tax_code`, `tax_behavior` |
| Added | Second line item for VAT at 23% |
| No changes needed | Frontend, pricing page, fee calculator, verify function |

