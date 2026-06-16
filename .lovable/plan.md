# Dealer Subscription Onboarding — Presentation Plan

Goal: Make it impossible for a newly-registered dealer to miss the subscription step, while leaving the existing verification flow untouched. Everything auto-disappears once their subscription is active.

## What the dealer will see

### 1. Hero subscription card on the dashboard (primary CTA)
A prominent branded card rendered at the **top** of `/dealer/dashboard`, above the welcome card. Only shown when `useDealerSubscription().isActive === false`.

Layout (Polish copy):
- Heading: **"Aktywuj subskrypcję, aby licytować"**
- Sub-line: short value statement — access to live auctions, unlimited bids, seller contact after winning.
- Benefits row (3 icon + label items): Dostęp do aukcji na żywo • Nielimitowane oferty • Dane sprzedającego po wygranej
- Large green CTA button: **"Subskrybuj teraz"** (bg `#16a34a`/green-600, white text) → navigates to `/dealer/subscription`
- Secondary text link: "Dowiedz się więcej" → also `/dealer/subscription`
- Subtle gradient background + green left border accent so it reads as positive/action (distinct from the red verification banner which signals a blocker).

Coexistence with verification banner: both can show simultaneously — verification banner stays red (account issue), subscription card stays green (opportunity). They serve different purposes and should not be merged.

### 2. Sidebar/navbar "Subskrybuj" nudge
- Add a permanent **"Subskrybuj"** menu entry (CreditCard icon, already added in earlier step) with a small **green pulsing dot** badge while `isActive === false`.
- Once active, the dot disappears and the label optionally swaps to "Subskrypcja" with a subtle check icon.
- Lives in both `NavbarDesktopMenu` (already linked) and the mobile menu.

### 3. Locked bid buttons on auction cards
- In the live auction list and `CarAuction` page, when the dealer is verified but not subscribed:
  - Replace the "Złóż ofertę" submit button with a disabled green button labeled **"Subskrybuj, aby licytować"**.
  - Clicking it routes to `/dealer/subscription`.
  - Tooltip: "Aktywna subskrypcja jest wymagana do składania ofert."
- Verified + subscribed dealers see the normal `BidForm` (unchanged).
- Unverified dealers continue to see the existing verification gate (untouched).

### 4. Return-to-dashboard after subscribing
- `create-subscription-checkout` already accepts success/cancel URLs. Set `success_url` to `/dealer/dashboard?subscription=success` and `cancel_url` to `/dealer/subscription?canceled=1`.
- On dashboard mount, if `?subscription=success` is present:
  - Show a one-time success toast: "Subskrypcja aktywna — możesz teraz licytować!"
  - Call `useDealerSubscription().refresh()` (with brief retry since the Stripe webhook may take a second).
  - Strip the query param.

## Files to change / add

Frontend only — no backend or schema changes.

- **New** `src/components/dealer/dashboard/SubscriptionPromptCard.tsx` — hero green card; renders nothing when `isActive` or still loading.
- **Edit** `src/pages/dealer/Dashboard.tsx` — render `<SubscriptionPromptCard />` above `welcomeCard`; handle `?subscription=success` query param (toast + refresh + cleanup).
- **Edit** `src/components/navbar/NavbarDesktopMenu.tsx` — add green pulsing dot badge next to the existing Subskrybuj link when not subscribed.
- **Edit** mobile menu component (locate via grep around `NavbarDesktopMenu`) — same nudge.
- **New** `src/components/dealer/SubscribeToBidButton.tsx` — disabled green button + tooltip used as a gate wrapper.
- **Edit** `src/components/dealer/BidForm.tsx` (and/or its wrapper in `CarAuction.tsx` and live auction card) — when verified but `!isActive`, render `SubscribeToBidButton` instead of the normal submit control.
- **Edit** `supabase/functions/create-subscription-checkout/index.ts` — point `success_url` to `/dealer/dashboard?subscription=success`.

## Behavior matrix

| Verification | Subscription | Dashboard top                              | Bid action                          |
|--------------|--------------|--------------------------------------------|-------------------------------------|
| Pending      | —            | Red verification banner (unchanged)        | Existing verification gate          |
| Approved     | Inactive     | Green subscription hero card               | "Subskrybuj, aby licytować" gate    |
| Approved     | Active       | Nothing extra (welcome card as today)      | Normal BidForm                      |

## Out of scope (intentionally not doing)
- No full-screen blocking gate — too aggressive; the hero card + locked bid button already provide a clear, unmissable funnel without trapping the user.
- No post-verification modal — adds a second interruption on top of the always-visible hero card; can revisit later if conversion is low.
- No changes to verification logic, RLS, or Stripe webhook handling.
