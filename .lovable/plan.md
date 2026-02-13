
# Add Horsepower to Auction Detail Page Specifications

## Problem
The horsepower ("Moc silnika") was added to `BasicSpecifications.tsx` and `BidCarDetailsDialog.tsx`, but the actual auction detail page at `/dealer/auction/:id` renders its own specifications section directly inside `src/pages/dealer/CarAuction.tsx`. This is the page shown in the screenshot -- and it was missed in the previous update.

## Fix

### File: `src/pages/dealer/CarAuction.tsx`

Add a new spec card for "Moc silnika" after the Engine Capacity card (after line 297), using the exact same card styling as the other spec items. It will display `{car.horsepower} KM` or fall back to "Brak danych".

```
{/* Moc silnika (Horsepower) */}
{car.horsepower && (
  <div className="group bg-secondary/50 border border-transparent rounded-xl ...">
    <div className="text-subtitle-text ...">
      Moc silnika
    </div>
    <div className="font-kanit font-medium text-body-text ...">
      {car.horsepower} KM
    </div>
  </div>
)}
```

The card will use the same responsive sizing (`isMobile` checks), hover effects, and font styling as the existing cards (Engine Capacity, VIN, etc.) so it fits perfectly into the grid.

Only one file needs to change: `src/pages/dealer/CarAuction.tsx`.
