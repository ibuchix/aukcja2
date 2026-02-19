

# Floating "Zloz oferte" Button for Mobile Auction Page

## Why the Previous Implementation Didn't Work

The sticky bid bar was added to `CarDetailsDialog.tsx` -- a dialog component used in other parts of the app. But the page you're actually viewing (`/dealer/auction/:carId`) is rendered by `CarAuction.tsx`, which is a completely different full-page component. That's why nothing appeared.

## Simplified Approach: Floating Button

Instead of the more complex sticky input bar, we'll add a simple floating button labeled "Zloz oferte" that appears on mobile once the user scrolls past the specifications section. Tapping it instantly scrolls the dealer down to the bidding section (the `SimpleBidManager`).

This is cleaner because:
- No duplicate bid input to maintain
- No risk of conflicting with the existing bid form
- One tap gets the dealer exactly where they need to be
- Minimal code, easy to maintain

## What the Dealer Sees (Mobile)

```text
+---------------------------+
| [Car Title]               |
| [Photos]                  |
| [Specyfikacja pojazdu]    |  <-- once user scrolls past this...
| [Historia Pojazdu]        |
| [Vehicle Health Report]   |
| [Condition & Features]    |
|                           |
|           [Zloz oferte] --+-- floating button appears (bottom-right)
|                           |
| [SimpleBidManager]        |  <-- button scrolls here
+---------------------------+
```

## Technical Changes

### File: `src/pages/dealer/CarAuction.tsx`

1. Add a `useRef` for the specifications section (line ~171 where "Specyfikacja pojazdu" heading is)
2. Add a `useRef` for the bidding section (line ~732 where `SimpleBidManager` is)
3. Add `useState` for `showFloatingBid` and `IntersectionObserver` in a `useEffect` (same pattern as the dialog version)
4. Add a floating button at the bottom of the component, conditionally rendered:
   - Only on mobile (`isMobile` -- already imported)
   - Only during live auctions (`isLive && !hasEnded`)
   - Only for verified dealers (`isVerified`)
   - Only after scrolling past the specs section

The button will:
- Be `position: fixed` at the bottom-center of the screen
- Use brand red (#D81B24) background
- Say "Zloz oferte" (Place a bid)
- On click, call `biddingRef.current.scrollIntoView({ behavior: 'smooth' })` to smoothly scroll to the bidding section
- Have a small shadow and rounded corners for clean appearance
- Use `z-index: 40` to float above content

### No new files needed

This is ~20 lines of additional code in `CarAuction.tsx` only. No new components, no changes to `MobileStickyBidBar`, no changes to `SimpleBidManager`.

### What Won't Change

- Desktop layout unchanged (button only shows on mobile)
- The existing `SimpleBidManager` bidding section stays exactly as-is
- No changes to bid submission logic
- The `CarDetailsDialog` sticky bar (from previous implementation) remains for when that dialog is used elsewhere
