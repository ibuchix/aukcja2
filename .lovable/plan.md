

# Sticky Mobile Bid Button

## What This Solves

On mobile, dealers must scroll through photos, specifications, condition report, and seller information before reaching the bid button at the bottom of the car details dialog. This risks losing interested dealers who never reach the bidding section.

## How It Works

When a mobile user opens a live auction car detail and scrolls past the specifications section, a compact sticky bid bar will appear fixed at the bottom of the dialog. It stays visible as they continue reading, giving them instant access to place a bid at any point.

The sticky bar will contain:
- The current reserve price (small text)
- A bid input field
- A "Place Bid" button

Tapping the bid button on the sticky bar will submit the bid directly (same logic as the existing `SimpleBidManager`). The original full bidding section at the bottom remains unchanged for context.

## Conditions for Showing the Sticky Bar

- Mobile only (using the existing `useIsMobile` hook)
- Live auction only (same `isLiveAuction` check already in place)
- Dealer is verified and has a profile
- User has scrolled past the Basic Specifications section (detected via Intersection Observer)

## Technical Details

### File 1: New Component -- `src/components/auction/MobileStickyBidBar.tsx`

A compact, fixed-position bid bar that:
- Uses `position: sticky` at the bottom of the dialog's scroll container
- Contains a small input + submit button in a single row
- Shows current reserve price as context
- Handles bid submission using the same `place_bid` RPC
- Has the brand red (#D81B24) styling consistent with the existing bid button
- Includes a small close/dismiss option so dealers can hide it if desired
- Uses `z-index` high enough to float above dialog content but below the dialog overlay

### File 2: Modified -- `src/components/CarDetailsDialog.tsx`

Changes:
- Import `useIsMobile` hook and the new `MobileStickyBidBar` component
- Add a `ref` to the Basic Specifications section div (line 206)
- Use an `IntersectionObserver` to detect when specs section scrolls out of the top of the viewport (meaning user has scrolled past it)
- Track a `showStickyBid` state variable
- Render `MobileStickyBidBar` at the bottom of `DialogContent` when conditions are met (mobile + live auction + verified dealer + scrolled past specs)
- Add bottom padding to the dialog content on mobile when the sticky bar is visible, so content isn't hidden behind it

### No other files change

The existing `MaxBidInterface`, `SimpleBidManager`, `BidForm`, and all bid logic remain untouched. The sticky bar is a completely separate, additive component that calls the same `place_bid` RPC directly.

## Visual Layout (Mobile)

```text
+---------------------------+
| [Car Title]         [X]   |
|                           |
| [Photos]                  |
|                           |
| [Status] [Reserve Price]  |
|                           |
| [Basic Specifications]    |  <-- sticky bar appears after
|                           |      user scrolls past this
| [Condition & Features]    |
|                           |
| [Seller Information]      |
|                           |
| [Full Bid Interface]      |  <-- original, stays in place
|                           |
+---------------------------+
| [Reserve: 15,000]  [___] [Bid] |  <-- sticky bar (mobile only)
+---------------------------+
```

## What Won't Break

- Desktop layout is completely unchanged (hook guards everything behind `isMobile`)
- The original full bidding section at the bottom remains for both mobile and desktop
- No changes to bid submission logic, RPC calls, or auction queries
- No changes to the `MaxBidInterface` or `SimpleBidManager` components
- The sticky bar uses the same validation (60% minimum, verified dealer check)
