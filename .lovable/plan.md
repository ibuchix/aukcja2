
# Plan: Remove Countdown Timer from All Dealer Auction Pages

## What We're Changing

The countdown timer (showing "Pozostały czas: 244:05:02") still appears in three dealer-facing components. You previously removed it from auction cards, and now we'll remove it from the bidding/details pages too.

## Files to Modify

### 1. `src/pages/dealer/CarAuction.tsx`

**Remove lines 738-743** (the "Pozostały czas" row showing the timer):

```tsx
<div className="flex justify-between items-center">
  <span className="text-muted-foreground font-medium">Pozostały czas:</span>
  <span className="font-medium">
    <AuctionTimer auctionEndTime={car.auctionEndTime} />
  </span>
</div>
```

**Also remove the unused import on line 9:**
```tsx
import { AuctionTimer } from "@/components/auction/AuctionTimer";
```

---

### 2. `src/components/dealer/cars/LiveAuctionDetailsDialog.tsx`

**Remove lines 255-262** (the "Pozostały czas" row showing the timer):

```tsx
<div className="flex justify-between items-center">
  <span className="text-muted-foreground font-medium">Pozostały czas:</span>
  <span className="font-medium">
    <AuctionTimer 
      auctionEndTime={car.auctionEndTime} 
    />
  </span>
</div>
```

**Also remove the unused import on line 7:**
```tsx
import { AuctionTimer } from "@/components/auction/AuctionTimer";
```

---

### 3. `src/components/CarDetailsDialog.tsx`

**Remove lines 206-213** (the timer display in auction info):

```tsx
{(scheduleInfo?.endTime || car.scheduleEndTime) && (
  <div className="flex items-center gap-2">
    <Clock className="h-4 w-4 text-gray-400" />
    <AuctionTimer 
      auctionEndTime={car.auctionEndTime} 
    />
  </div>
)}
```

**Also remove the unused import on line 12:**
```tsx
import { AuctionTimer } from "@/components/auction/AuctionTimer";
```

---

## Summary

| File | Change |
|------|--------|
| `CarAuction.tsx` | Remove "Pozostały czas" row and AuctionTimer import |
| `LiveAuctionDetailsDialog.tsx` | Remove "Pozostały czas" row and AuctionTimer import |
| `CarDetailsDialog.tsx` | Remove timer section and AuctionTimer import |

## Result

After these changes, dealers will no longer see the countdown timer anywhere:
- Not on auction cards (already done)
- Not on the auction bidding page
- Not in auction details dialogs

The timer component (`AuctionTimer.tsx`) will remain in the codebase in case it's needed for seller views or future use.
