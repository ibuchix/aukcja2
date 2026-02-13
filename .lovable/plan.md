

# Restore Wishlist Heart Button on Auction Cards

## Problem
The heart icon for adding cars to the wishlist was removed from the auction card image overlay during a previous badge cleanup. All the supporting code (import, hook, click handler) is still in `LiveAuctionCard.tsx` -- only the JSX rendering the button is missing.

## Fix

### File: `src/components/dealer/cars/LiveAuctionCard.tsx`

Add the heart button back into the image overlay area (the empty space at line 183-185, inside the `aspect-[4/3] relative` div). The button will:

- Be positioned in the top-right corner of the car image (`absolute top-2 right-2`)
- Use the existing `handleWishlistClick` function (which already calls `e.stopPropagation()`)
- Use the existing `isInWishlist(car.id)` check to toggle between filled (red) and outline (white) heart
- Have a semi-transparent dark background circle for visibility over any image
- Match the app's red color (#D81B24) when active

The added JSX (inserted after the `<img>` tag, before the closing `</div>` of the image container):

```
<button
  onClick={handleWishlistClick}
  className="absolute top-2 right-2 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors z-10"
  aria-label="Dodaj do listy życzeń"
>
  <Heart
    className={cn(
      "h-5 w-5 transition-colors",
      isInWishlist(car.id)
        ? "fill-[#D81B24] text-[#D81B24]"
        : "text-white"
    )}
  />
</button>
```

No new files, no new dependencies. This is a single-line restoration using code that already exists in the component.
