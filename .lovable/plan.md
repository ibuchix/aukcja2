
# Plan: Enhance Bid Input and Sticky Bidding Section

## Overview

Two enhancements requested:
1. **Bigger bid input with red border** - Make the input more prominent and easy to spot
2. **Sticky bidding section** - Keep the bidding panel visible as users scroll through auction details

---

## Change 1: Enhance Bid Input Box

### Current State (SimpleBidManager.tsx, line 231-240)

```tsx
<Input
  id="bidAmount"
  type="number"
  value={bidAmount}
  onChange={(e) => setBidAmount(e.target.value)}
  min="1"
  step="1"
  placeholder="Wprowadź swoją ofertę"
  disabled={isSubmitting}
/>
```

Uses default Input styling with `h-10` (40px) height.

### Proposed Changes

Add custom classes to make the input stand out:
- **Taller**: `h-14` (56px height instead of 40px)
- **Larger text**: `text-lg` (18px font size)
- **Red border**: `border-2 border-[#D81B24]` (prominent red border using brand color)
- **Red focus ring**: `focus-visible:ring-[#D81B24]` (red highlight when focused)

```tsx
<Input
  id="bidAmount"
  type="number"
  value={bidAmount}
  onChange={(e) => setBidAmount(e.target.value)}
  min="1"
  step="1"
  placeholder="Wprowadź swoją ofertę"
  disabled={isSubmitting}
  className="h-14 text-lg border-2 border-[#D81B24] focus-visible:ring-[#D81B24]"
/>
```

---

## Change 2: Smooth Sticky Bidding Section

### Current State (CarAuction.tsx, line 709)

```tsx
<div className="xl:sticky xl:top-6 space-y-6">
```

Currently only sticky on `xl` screens (1280px+).

### Analysis

The grid layout is:
```tsx
<div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
```

This means:
- **Desktop (xl: 1280px+)**: 3-column grid, sidebar is in right column → sticky makes sense
- **iPad/smaller**: Single column layout, content stacks vertically

For **iPad landscape** (1024px-1279px), the layout is still single-column, so making it sticky at `lg` won't have a visible effect since there's nothing to scroll past.

However, to ensure smooth experience when users resize or on larger iPads, I'll keep it at `xl` where the sidebar is actually in a side column. But I'll add better styling for the sticky behavior:

### Proposed Changes

Keep the `xl:sticky` breakpoint (since that's when the 3-column layout activates) but improve the sticky experience:

```tsx
<div className="xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto space-y-6">
```

This adds:
- **`xl:max-h-[calc(100vh-3rem)]`**: Limits height to viewport minus top offset
- **`xl:overflow-y-auto`**: Adds scroll if content is taller than viewport (prevents content from being cut off)

---

## Files to Modify

| File | Line | Change |
|------|------|--------|
| `src/components/auction/SimpleBidManager.tsx` | 231 | Add `className` with enhanced styling |
| `src/pages/dealer/CarAuction.tsx` | 709 | Add max-height and overflow for smooth sticky |

---

## Visual Result

### Bid Input
```text
+------------------------------------------+
|                                          |  ← Bigger (56px height)
|    Wprowadź swoją ofertę                 |  ← Larger text (18px)
|                                          |
+==========================================+  ← Bold red border (#D81B24)
```

### Sticky Behavior
- On desktop (1280px+): Bidding section stays visible in the right column as user scrolls through photos and details
- If bidding section is taller than viewport, it becomes scrollable independently
- Smooth, non-jarring experience as the rest of the page scrolls beneath it
