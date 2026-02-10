

# Polish Language Fixes, Label Change, and Text Size Improvements

## Overview

Four targeted changes across 3 files to fix the language consistency on auction cards and improve text legibility.

## Changes

### 1. BidInput placeholder -- English to Polish

**File: `src/components/auction/bid-form/BidInput.tsx` (line 24)**

Change the placeholder from `"Enter any bid amount"` to `"Wprowadź swoją ofertę"` to match the detail page.

### 2. BidFormButton label -- English to Polish

**File: `src/components/auction/bid-form/BidFormButton.tsx` (lines 14-15)**

Change default `label` from `"Place Bid"` to `"Złóż ofertę"` and `submittingLabel` from `"Placing Bid..."` to `"Składanie oferty..."`.

### 3. "Cena orientacyjna" to "Cena wyjściowa"

**File: `src/lib/vehicleTranslations.ts` (line 120)**

Change the translation for `'Reserve Price'` from `'Cena orientacyjna'` to `'Cena wyjściowa'`. This affects all places where `translateSpecificationLabel('Reserve Price')` is called, keeping it consistent app-wide.

### 4. Bigger, more legible car info text on cards

**File: `src/components/dealer/cars/LiveAuctionCard.tsx`**

Three text size increases:

- **Car title** (line 191): Change from `text-base` / `text-lg` to `text-lg` / `text-xl`
- **Key specs** (line 197): Change from `text-xs` / `text-sm` to `text-sm` / `text-base`
- **Location** (line 210): Change from `text-xs` / `text-sm` to `text-sm` / `text-base`

