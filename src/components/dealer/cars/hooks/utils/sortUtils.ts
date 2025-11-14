
export const applySorting = (query: any, sortOption: string) => {
  switch (sortOption) {
    case "newest":
      return query.order('created_at', { ascending: false });
    case "oldest":
      return query.order('created_at', { ascending: true });
    case "price-high-low":
      return query.order('reserve_price', { ascending: false });
    case "price-low-high":
      return query.order('reserve_price', { ascending: true });
    case "year-new-old":
      return query.order('year', { ascending: false });
    case "year-old-new":
      return query.order('year', { ascending: true });
    default:
      return query.order('created_at', { ascending: false });
  }
};
