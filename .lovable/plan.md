
# Add Horsepower to Vehicle Specifications

## Overview
The `horsepower` column exists in the database with real data for all auction cars, but is never passed through to the UI. Three small changes will surface it in the specification sections, labeled in Polish as "Moc silnika" with "KM" units.

## Changes

### 1. Add `horsepower` to the data transformation layer
**File: `src/utils/carDataHelpers.ts`**

Add `horsepower: car.horsepower || null` to the return object in `processCarData`, alongside the other vehicle fields like `engineCapacity`.

### 2. Add `horsepower` to the CarListing type
**File: `src/types/cars.ts`**

Add `horsepower?: number | null` to the `CarListing` interface, near the other engine-related fields like `engineCapacity`.

### 3. Display horsepower in the specification sections

**File: `src/components/car-details/BasicSpecifications.tsx`**

Add a new grid cell after Engine Capacity / Fuel Type:
- Label: `Moc silnika` (via `translateSpecificationLabel('Horsepower')`)
- Value: `{car.horsepower} KM` or "N/A"

**File: `src/components/dealer/bids/BidCarDetailsDialog.tsx`**

Add a new spec card in the existing grid (after Fuel Type, before Number of Keys):
- Label: `Moc silnika` (hardcoded Polish, matching the existing pattern in this file)
- Value: `{displayCar?.horsepower} KM` or "Brak danych"
- Same card styling as the other secondary spec cards

### 4. Add Polish translation entry
**File: `src/lib/vehicleTranslations.ts`**

Add `'Horsepower': 'Moc silnika'` to the specification label translations map so `BasicSpecifications.tsx` can use the standard `translateSpecificationLabel` call.

## Technical Details
- No new dependencies or database changes needed
- The `horsepower` column is already in the Supabase types (`number | null`)
- Unit displayed as "KM" (Polish convention for horsepower, not "HP")
