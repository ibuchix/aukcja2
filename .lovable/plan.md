

# Fix Location (County) Filter for Auctions

## Root Cause

The auction browser uses `buildAuctionQuery` in `src/components/dealer/auction/hooks/services/auctionDataService.ts` to fetch auctions. This function applies filters for make, model, year, price, and mileage -- but **the county filter was never added**. When a dealer selects a location, it gets stored in `filters.county` but is silently ignored.

## Database Reality

The county data in the database is inconsistent -- values like `"dolnoslaskie"`, `"Dolnośląskie"`, `"Dolnośląskie "` (trailing space), `"Dolno śląskie"` all exist. The filter needs to use a case-insensitive partial match (`ilike`) to work reliably.

## Fix

### File: `src/components/dealer/auction/hooks/services/auctionDataService.ts`

Add the missing county filter after the existing mileage filter block (after line 127), before the cursor pagination logic:

```typescript
if (filters.county) {
  query = query.ilike("county", `%${filters.county}%`);
}
```

This uses the same `ilike` partial-match approach already used in `filterUtils.ts`, which handles the messy data well. When a dealer selects "Dolnośląskie", it will match all variations in the database.

No other files need to change -- the `CountyFilter` component and filter state management already work correctly. The only gap was the query not applying the filter.
