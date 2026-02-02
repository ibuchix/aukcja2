
# Plan: Remove Countdown Timer from Dealer Car Cards

## What We're Changing

The countdown timer (showing time like "97:28:08") currently displays on car cards in the dealer dashboard when an auction is live. You want to remove this timer from the dealer's view on these cards.

## File to Modify

**`src/components/dealer/cars/LiveAuctionCard.tsx`**

Remove lines 239-243 which render the AuctionTimer component:

```tsx
{isLive && auctionEndTime && (
  <div className="flex-shrink-0">
    <AuctionTimer auctionEndTime={auctionEndTime} />
  </div>
)}
```

Also clean up the unused import on line 7:
```tsx
import { AuctionTimer } from "@/components/auction/AuctionTimer";
```

## Result

After this change:
- The dealer car cards will no longer show the countdown timer
- The "Aukcja na żywo" (Live Auction) badge will still appear on live auctions
- The timer will still be visible in other places (like the detailed auction page) if needed

## Summary

| File | Change |
|------|--------|
| `LiveAuctionCard.tsx` | Remove AuctionTimer import and remove the timer display section |
