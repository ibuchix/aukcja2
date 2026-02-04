
# Plan: Enhance Typography for Price Section

## Current State

Looking at the file, I can see:

**Line 188-189** (explanation under "Cena wyjściowa"):
```tsx
<p className="text-xs text-muted-foreground">
  Oferty mogą być składane powyżej lub poniżej tej kwoty...
</p>
```
This is `text-xs` (12px)

**Lines 249-254** (text under bidding button):
```tsx
<div className="mt-4 text-sm text-muted-foreground space-y-2">
```
This is `text-sm` (14px)

## Changes Required

We'll update two things as discussed:

### 1. Make "Cena wyjściowa" and price more prominent (lines 183-191)
- Split label and price into separate elements
- Label: `text-base font-medium` (16px)
- Price: `text-3xl font-bold text-foreground` (30px, bold, high contrast)
- Center align for visual impact

### 2. Make explanation text bigger (line 188-189)
- Change from `text-xs` (12px) to `text-sm` (14px) to match the button info text

## Updated Code

**Lines 183-191** will become:

```tsx
{reservePrice && (
  <div className="space-y-2">
    <div className="text-center">
      <p className="text-base text-muted-foreground font-medium">
        Cena wyjściowa
      </p>
      <p className="text-3xl font-bold text-foreground">
        {Math.round(reservePrice).toLocaleString('pl-PL')} zł
      </p>
    </div>
    <p className="text-sm text-muted-foreground text-center">
      Oferty mogą być składane powyżej lub poniżej tej kwoty. Im bardziej atrakcyjna oferta, tym większa szansa na akceptację.
    </p>
  </div>
)}
```

## Visual Comparison

| Element | Before | After |
|---------|--------|-------|
| "Cena wyjściowa" label | `text-sm` (14px) | `text-base font-medium` (16px) |
| Price in złoty | `text-sm` (14px) | `text-3xl font-bold` (30px) |
| Explanation text | `text-xs` (12px) | `text-sm` (14px) |
| Layout | Left-aligned | Center-aligned |

## File to Modify

**`src/components/auction/SimpleBidManager.tsx`** - Lines 183-191

## Result

The price will be immediately visible with large, bold typography (30px), and the explanation text below will match the size of the informational text under the bidding button (both 14px).
