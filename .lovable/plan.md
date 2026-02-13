
# Fix Location Filter to Match All Diacritical Variants

## Problem

The database contains voivodeship names written in many ways -- with full Polish diacritics ("Łódzkie"), without them ("Lodzkie"), partially ("Łodzkie"), and with trailing spaces. The current `ilike` filter only matches exact character patterns, so selecting "Łódzkie" from the dropdown misses entries like "Lodzkie" or "lodzkie" because `ł` does not match `l` in PostgreSQL `ilike`.

## Solution

Create a diacritics-aware mapping utility and update the query to match **all known ASCII and Polish variants** of each voivodeship name.

### Step 1 -- New utility: `src/constants/countyVariants.ts`

A map from each canonical Polish county name to an array of search patterns that cover all realistic spellings. For example:

```
"Łódzkie" -> ["łódzkie", "lodzkie", "łodzkie"]
"Śląskie" -> ["śląskie", "slaskie", "ślaskie"]
"Małopolskie" -> ["małopolskie", "malopolskie"]
"Świętokrzyskie" -> ["świętokrzyskie", "swietokrzyskie", "świetokrzyskie"]
"Warmińsko-mazurskie" -> ["warmińsko-mazurskie", "warminsko-mazurskie"]
"Kujawsko-pomorskie" -> ["kujawsko-pomorskie"]  (no diacritics to strip)
```

Each variant will be used as a separate `ilike` pattern so that any spelling in the database is caught.

A helper function `getCountySearchPatterns(county: string): string[]` will return the list of patterns for a given canonical name.

### Step 2 -- Update query in `auctionDataService.ts`

Replace the single `ilike` line:

```typescript
if (filters.county) {
  query = query.ilike("county", `%${filters.county}%`);
}
```

With an `OR` filter that covers all variants:

```typescript
if (filters.county) {
  const patterns = getCountySearchPatterns(filters.county);
  const orCondition = patterns
    .map(p => `county.ilike.%${p}%`)
    .join(',');
  query = query.or(orCondition);
}
```

This generates a query like `county ilike '%łódzkie%' OR county ilike '%lodzkie%' OR county ilike '%łodzkie%'`, catching every variation.

### Step 3 -- Apply the same fix in `filterUtils.ts`

The same county filter logic in `src/components/dealer/cars/hooks/utils/filterUtils.ts` (used for non-auction car browsing) also needs updating with the same pattern-matching approach to stay consistent.

## Files Changed

| File | Change |
|------|--------|
| `src/constants/countyVariants.ts` (new) | Mapping of canonical county names to all diacritical variants |
| `src/components/dealer/auction/hooks/services/auctionDataService.ts` | Replace single `ilike` with multi-variant `or` filter |
| `src/components/dealer/cars/hooks/utils/filterUtils.ts` | Same multi-variant approach for consistency |
