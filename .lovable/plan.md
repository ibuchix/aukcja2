

# Plan: Swap Bidding Box and Info Box Positions

## What We're Changing

Currently on the auction page, the order is:
1. Blue info box ("Informacje o licytacji" with bullet points)
2. Auction status (Cena orientacyjna, etc.)
3. Bidding box ("Złóż ofertę" with input and button)
4. Partner images (carvertical, Autobaza)

After the change, the order will be:
1. Bidding box ("Złóż ofertę" with input and button) - **without partner images**
2. Auction status (Cena orientacyjna, etc.)
3. Blue info box ("Informacje o licytacji")
4. Partner images (carvertical, Autobaza)

This puts the bidding action at the very top so dealers immediately see where to place their offer.

---

## Files to Modify

### 1. `src/components/auction/SimpleBidManager.tsx`

**Remove the partner images section** (lines 243-288) from this component. The partner images will be moved to be rendered separately in the parent component.

This means removing:
```tsx
<div className="mt-4 flex flex-col items-center">
  <a href="https://www.carvertical.com" ...>
    <img src="//carvertical..." ... />
  </a>
  <img ... tracking pixel ... />
  <div className="mt-4" />
  <a href="https://www.autobaza.pl/..." ...>
    <img src="https://www.autobaza.pl/..." ... />
  </a>
</div>
```

---

### 2. `src/pages/dealer/CarAuction.tsx`

**Reorder the right column sections** to swap positions:

**Current order (lines 711-751):**
```tsx
<div className="xl:sticky xl:top-6 space-y-6">
  {/* 1. Bid Count Display (blue box) */}
  {isLive && !hasEnded && (
    <BidCountDisplay carId={car.id} />
  )}

  {/* 2. Auction Status */}
  <div className="p-6 bg-muted rounded-lg">...</div>

  {/* 3. Bidding Section (SimpleBidManager) */}
  {isLive && !hasEnded && isVerified && (
    <SimpleBidManager ... />
  )}
```

**New order:**
```tsx
<div className="xl:sticky xl:top-6 space-y-6">
  {/* 1. Bidding Section (SimpleBidManager) - MOVED TO TOP */}
  {isLive && !hasEnded && isVerified && (
    <SimpleBidManager ... />
  )}

  {/* 2. Auction Status */}
  <div className="p-6 bg-muted rounded-lg">...</div>

  {/* 3. Bid Count Display (blue box) - MOVED DOWN */}
  {isLive && !hasEnded && (
    <BidCountDisplay carId={car.id} />
  )}

  {/* 4. Partner Images (NEW - extracted from SimpleBidManager) */}
  {isLive && !hasEnded && (
    <div className="flex flex-col items-center">
      ... partner images ...
    </div>
  )}
```

---

## Visual Before/After

```text
BEFORE:                          AFTER:

+------------------------+       +------------------------+
| 📘 Informacje o        |       | 💰 Złóż ofertę         |
|    licytacji           |       |    Cena orientacyjna   |
|    • bullet 1          |       |    [Input field]       |
|    • bullet 2          |       |    [Złóż ofertę btn]   |
+------------------------+       +------------------------+
| Status licytacji       |       | Status licytacji       |
| Cena orientacyjna:     |       | Cena orientacyjna:     |
+------------------------+       +------------------------+
| 💰 Złóż ofertę         |       | 📘 Informacje o        |
|    [Input field]       |       |    licytacji           |
|    [Złóż ofertę btn]   |       |    • bullet 1          |
|    [Partner images]    |       |    • bullet 2          |
+------------------------+       +------------------------+
                                 |    [Partner images]    |
                                 +------------------------+
```

---

## Summary

| File | Changes |
|------|---------|
| `SimpleBidManager.tsx` | Remove partner images section (lines 243-288) |
| `CarAuction.tsx` | Reorder: SimpleBidManager first, then Auction Status, then BidCountDisplay, then add partner images separately |

## Result

- Dealers see the bidding input immediately at the top
- The informational blue box moves below, providing context after they've seen the action area
- Partner images remain at the bottom of the bidding section

