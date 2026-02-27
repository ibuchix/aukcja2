
# Open Car Auction in New Tab

## What Changes

When a dealer clicks on a car in the auction listings, instead of navigating away from the current page, the car's auction page will open in a **new browser tab**. The dealer stays on the auction listing page and can continue browsing other cars.

## Technical Change

**Single file change: `src/components/dealer/cars/LiveAuctionCard.tsx`**

Line 162 currently uses React Router's `navigate()` which replaces the current page:
```tsx
navigate(`/dealer/auction/${car.id}`);
```

This will be changed to:
```tsx
window.open(`/dealer/auction/${car.id}`, '_blank');
```

This opens the auction page in a new browser tab while keeping the dealer on the current listings page. The new tab will still be a protected route requiring authentication (the dealer's session is shared across tabs).

## What Won't Break

- The `/dealer/auction/:carId` route and `CarAuction.tsx` page remain completely unchanged
- Authentication and protected routes work across tabs (Supabase session is stored in localStorage, shared between tabs)
- The floating "Zloz oferte" button, bidding logic, and all auction functionality stay the same
- The `onClick` prop path (line 159-160) for any parent component that passes a custom click handler is unchanged
- Back button on the car auction page still works (it uses `navigate(-1)` which will just close the tab or go to browser history)
