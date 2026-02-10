

# Streamline Auction Cards and Add Inline Bidding

## Overview

Three changes to the `LiveAuctionCard` component to declutter the cards and let dealers bid directly from the card listing without clicking into the detail page.

## Changes

### 1. Remove colourful badges from the car image

Remove all `PhotoBadge` overlays from the image area:
- "Aukcja na zywo" (green live badge, top-left)
- "Uszkodzony" (red damage badge, top-right)
- "Zarejestrowany w Polsce" / "Zweryfikowany prywatny sprzedajacy" (bottom-left)
- "Platnosc przy odbiorze" (bottom-right)

The wishlist heart button stays -- it is not a badge, it is a functional button.

### 2. Remove VIN from the card

Remove the VIN display block (lines 278-283 in `LiveAuctionCard.tsx`). Dealers can still see the VIN when they click into the car detail page.

### 3. Add inline BidForm below the pricing section

Reuse the existing `BidForm` component (`src/components/auction/bid-form/BidForm.tsx`) and place it directly below the price on each card. This gives dealers the option to bid immediately without navigating to the detail page.

The `BidForm` needs `carId`, `dealerId`, `currentHighestBid`, `minimumIncrement`, and optionally `reservePrice` -- all of which are already available in `LiveAuctionCard`. The bid form click will use `e.stopPropagation()` to prevent the card's click-to-navigate behaviour from triggering.

The bid form will only show when the auction is live (not ended, not scheduled).

---

## Technical Details

### File: `src/components/dealer/cars/LiveAuctionCard.tsx`

**Removals:**
- Remove all 4 `PhotoBadge` usages (lines 185-229)
- Remove the `PhotoBadge` import (line 8)
- Remove VIN block (lines 278-283)
- Remove `FileText` from the lucide import since it was only used for VIN

**Addition:**
- Import `BidForm` from `@/components/auction/bid-form/BidForm`
- After the pricing section (after line 371's closing `</div>`), add a wrapper `div` with `onClick={e => e.stopPropagation()}` containing the `BidForm` component
- Only render the bid form when the auction is live (`isLive && !hasEnded`)
- Pass props: `carId={car.id}`, `dealerId={dealerId}`, `currentHighestBid={car.current_bid || 0}`, `minimumIncrement={250}`, `reservePrice={reservePrice}`

