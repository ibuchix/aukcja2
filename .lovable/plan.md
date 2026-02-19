

# Fix: Floating Bid Button Visibility Timing

## Problem

The `specsRef` is attached to the outer wrapper div (line 186) that contains ALL vehicle details (specs, history, condition, features, partners). The IntersectionObserver only fires when that entire giant div leaves the viewport -- which is why the button only appears near the partners section at the very bottom.

## Fix (single file, ~10 lines changed)

### File: `src/pages/dealer/CarAuction.tsx`

**Change 1: Move `specsRef` to the specs heading only**

Currently (line 186):
```
<div className="space-y-6" ref={specsRef}>
```

Move the ref to the "Specyfikacja pojazdu" heading element (line 188) instead, so the observer triggers as soon as the heading scrolls out of view -- exactly when the user finishes passing the specs title.

**Change 2: Add a second IntersectionObserver for `biddingRef`**

Track a `biddingInView` state. When the bidding section (`SimpleBidManager`) enters the viewport, hide the floating button since the dealer is already at the real bid form.

Updated useEffect logic:
```
specsRef not visible  -->  show button
biddingRef visible    -->  hide button
```

So the button shows when: specs heading is off-screen AND bidding section is not yet on-screen.

**Change 3: Update the visibility condition**

Currently:
```
{isMobile && isLive && !hasEnded && isVerified && showFloatingBid && (...)}
```

Updated to:
```
{isMobile && isLive && !hasEnded && isVerified && showFloatingBid && !biddingInView && (...)}
```

## Result

- Button appears right after the dealer scrolls past "Specyfikacja pojazdu"
- Button follows them through history, condition, features, partners
- Button disappears when they reach the actual "Zloz oferte" bidding section
- Desktop completely unaffected
