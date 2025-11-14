
export const getSortConfig = (sortOption: string) => {
  switch (sortOption) {
    case "ending-soon":
      return { field: 'auction_end_time', direction: 'asc' as const };
    case "newest":
      return { field: 'auction_end_time', direction: 'desc' as const };
    case "price-low-high":
      return { field: 'reserve_price', direction: 'asc' as const };
    case "price-high-low":
      return { field: 'reserve_price', direction: 'desc' as const };
    case "highest-bid":
      return { field: 'current_bid', direction: 'desc' as const };
    case "mileage-low":
      return { field: 'mileage', direction: 'asc' as const };
    case "mileage-high":
      return { field: 'mileage', direction: 'desc' as const };
    case "year-new-old":
      return { field: 'year', direction: 'desc' as const };
    case "year-old-new":
      return { field: 'year', direction: 'asc' as const };
    default:
      return { field: 'auction_end_time', direction: 'asc' as const };
  }
};
