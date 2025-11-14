
export const getSortConfig = (sortOption: string) => {
  switch (sortOption) {
    case "newest":
      return { field: 'auction_end_time', direction: 'desc' as const };
    case "price-low-high":
      return { field: 'reserve_price', direction: 'asc' as const };
    case "price-high-low":
      return { field: 'reserve_price', direction: 'desc' as const };
    case "year-new-old":
      return { field: 'year', direction: 'desc' as const };
    case "year-old-new":
      return { field: 'year', direction: 'asc' as const };
    default:
      return { field: 'auction_end_time', direction: 'desc' as const };
  }
};
