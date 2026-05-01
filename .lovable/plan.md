# Show Bezwypadkowy and Salon PL Badges on Auction Cards

## Goal

Surface two trust signals as eye-catching badges on every auction car card so dealers can spot them at a glance:

- **Bezwypadkowy** — bright green badge, white text. Shown when the car has no accident history recorded in Poland or abroad.
- **Salon PL** — white background, deep red text (`#D81B24`). Shown when the car originated from a Polish dealership (Polish origin).

Example: the 2018 MERCEDES-BENZ GLC-CLASS that qualifies as Bezwypadkowy currently shows nothing on its auction card — after this change the green Bezwypadkowy badge will appear over its photo.

## How the data maps (verified against the database)

The data already exists on the `cars` table — no schema change needed:

- **Bezwypadkowy** → `is_accident_record_poland === false` AND `is_accident_record_abroad === false`
  (both fields must be explicitly `false`, not `null`. `null` means "not recorded" and should NOT trigger the badge.)
- **Salon PL** → `is_polish_origin === true`

Both fields are already mapped through `src/utils/carDataHelpers.ts` into `isAccidentRecordPoland`, `isAccidentRecordAbroad`, and `isPolishOrigin` on the `CarListing` object that auction cards consume.

## Where the badges will appear

The auction card component is `src/components/dealer/cars/LiveAuctionCard.tsx`. The badges will be overlaid on the car photo (top-left corner of the image), stacked vertically when both apply, so they remain visible on mobile and desktop without interfering with the wishlist heart (top-right).

```text
┌────────────────────────────┐
│ [Bezwypadkowy]        [♥]  │
│ [Salon PL]                 │
│                            │
│         car photo          │
└────────────────────────────┘
```

## Visual specs

- **Bezwypadkowy badge**
  - Background: solid green (`bg-green-600`), white text
  - Bold, rounded, with subtle shadow so it stays readable on any photo
  - Text: "Bezwypadkowy"
- **Salon PL badge**
  - Background: white, text in deep red `#D81B24`
  - Same size/shape as Bezwypadkowy for visual consistency
  - Text: "Salon PL"
- Both use the same Kanit semibold styling already used elsewhere on the cards.
- On mobile, badges shrink slightly (smaller text / padding) so they don't dominate the photo.

## Implementation steps

1. Reuse and extend the existing `src/components/dealer/cars/PhotoBadge.tsx` component:
   - Add two new variants: `accident-free` (green/white) and `salon-pl` (white background, `#D81B24` text).
   - The component already handles positioning and mobile sizing.
2. In `LiveAuctionCard.tsx`, inside the image container, render:
   - `<PhotoBadge variant="accident-free" position="top-left">Bezwypadkowy</PhotoBadge>` when both accident fields are explicitly `false`.
   - `<PhotoBadge variant="salon-pl" position="top-left">Salon PL</PhotoBadge>` when `isPolishOrigin === true`.
   - When both apply, stack them vertically with a small gap so they don't overlap.
3. Verify the same change is applied to any other auction card surface that needs it. Audit:
   - `LiveAuctionCard.tsx` (main auction grid) — primary target.
   - `LiveAuctionDetailsDialog.tsx` — extend with the same badges on the hero image inside the dialog so the signal is consistent.
   - `CarListingCard.tsx` (dealer car listings grid) — out of scope unless you want it there too; this plan keeps the change focused on the auction surfaces only.

## Out of scope

- No changes to `cars` table, RLS, storage, or bid logic.
- No changes to the seller-side form that captures these fields.
- No new translations file — badge copy is hard-coded Polish (matches the rest of the auction UI).

## Verification

After implementation, on the auction grid:

1. The qualifying 2018 MERCEDES-BENZ GLC-CLASS (id `848cf0aa-fdc4-4164-97d5-99a4d043d8db`) shows the green **Bezwypadkowy** badge over its photo.
2. The other three GLC entries (with `null` accident fields) show no Bezwypadkowy badge.
3. Any car with `is_polish_origin = true` shows the white **Salon PL** badge in deep red text.
4. Cards without either signal look unchanged.
5. Both mobile (≤640px) and desktop renderings stay readable; badges don't collide with the wishlist heart.
