
# Fix: Match "Opinie naszych dealerów" Heading to "Dlaczego warto nas wybrać"

## Problem
The "Opinie naszych dealerów" heading uses `text-heading-md` (1.5rem) with `font-semibold`, while "Dlaczego warto nas wybrać" uses `text-3xl` (1.875rem) with `font-bold`. They should match.

## Fix (1 file)

### `src/components/DealerReviews.tsx`

Change the `<h2>` className from:
```
font-kanit text-heading-md text-center text-foreground mb-10
```
to:
```
text-3xl font-bold text-center text-body-text mb-10
```

On mobile, add responsive sizing to match the Services pattern (`text-2xl` on mobile, `text-3xl` on desktop). This requires using the `useIsMobile` hook (already available in the project).

### Technical detail
- Import `useIsMobile` from `@/hooks/use-mobile`
- Use conditional class: `${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-center text-body-text mb-10`
