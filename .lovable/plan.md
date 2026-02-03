

# Plan: Remove "Status licytacji" Section from Auction Pages

## What We're Removing

The gray box showing:
- **"Status licytacji"** heading
- **"Cena orientacyjna:"** with the reserve price
- **"Aktualna oferta:"** with current bid (if exists)

## Files to Modify

### 1. `src/pages/dealer/CarAuction.tsx`

**Remove lines 722-744** (the entire "Status licytacji" section):

```tsx
{/* Auction Status */}
<div className="p-6 bg-muted rounded-lg">
  <h3 className="text-xl font-semibold mb-4">Status licytacji</h3>
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground font-medium">Cena orientacyjna:</span>
      <span className="font-bold text-lg">{formatCurrency(car.reservePrice || 0)}</span>
    </div>
    
    {car.currentBid && car.currentBid > 0 && (
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground font-medium">Aktualna oferta:</span>
        <span className={cn(...)}>
          {formatCurrency(car.currentBid)}
        </span>
      </div>
    )}
    
  </div>
</div>
```

**No unused imports** - Both `formatCurrency` and `cn` are still used elsewhere in the file (e.g., line 681 for finance amount display).

---

### 2. `src/components/dealer/cars/LiveAuctionDetailsDialog.tsx`

**Remove lines 241-249** (the "Status licytacji" section):

```tsx
<div className="p-6 bg-muted rounded-lg">
  <h3 className="text-xl font-semibold mb-4">Status licytacji</h3>
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground font-medium">Cena orientacyjna:</span>
      <span className="font-bold text-lg">{formatCurrency(car.reservePrice || car.reserve_price || 0)}</span>
    </div>
  </div>
</div>
```

**No unused imports** - `formatCurrency` is still used on line 219 to display finance amount.

---

## Code Bloat Check

| Import/Utility | Still Used? | Location |
|----------------|-------------|----------|
| `formatCurrency` in CarAuction.tsx | Yes | Line 681 (finance amount) |
| `cn` in CarAuction.tsx | Yes | Lines 119, 154, 178, 182, etc. (many places) |
| `formatCurrency` in LiveAuctionDetailsDialog.tsx | Yes | Line 219 (finance amount) |

**All imports remain in use** - no cleanup needed for imports.

---

## Summary

| File | Changes | Cleanup Needed? |
|------|---------|-----------------|
| `CarAuction.tsx` | Remove lines 722-744 | No - imports still used |
| `LiveAuctionDetailsDialog.tsx` | Remove lines 241-249 | No - imports still used |

## Result

After these changes, the auction sidebar will only show:
1. **Bidding box** ("Złóż ofertę") - at top
2. **Partner images** (carvertical, Autobaza) - at bottom

No orphaned code or unused imports will remain.

