
import { AuctionFilters } from "../../../auction/types";

export const applyFilters = (query: any, filters: AuctionFilters, searchQuery: string) => {
  let filteredQuery = query;

  // Apply filters
  if (filters.make && typeof filters.make === 'string') {
    filteredQuery = filteredQuery.ilike('make', `%${filters.make}%`);
  }
  
  if (filters.model && typeof filters.model === 'string') {
    filteredQuery = filteredQuery.ilike('model', `%${filters.model}%`);
  }
  
  if (filters.yearFrom && typeof filters.yearFrom === 'number') {
    filteredQuery = filteredQuery.gte('year', filters.yearFrom);
  }
  
  if (filters.yearTo && typeof filters.yearTo === 'number') {
    filteredQuery = filteredQuery.lte('year', filters.yearTo);
  }
  
  if (filters.priceFrom && typeof filters.priceFrom === 'number') {
    filteredQuery = filteredQuery.gte('reserve_price', filters.priceFrom);
  }
  
  if (filters.priceTo && typeof filters.priceTo === 'number') {
    filteredQuery = filteredQuery.lte('reserve_price', filters.priceTo);
  }
  
  if (filters.mileageFrom && typeof filters.mileageFrom === 'number') {
    filteredQuery = filteredQuery.gte('mileage', filters.mileageFrom);
  }
  
  if (filters.mileageTo && typeof filters.mileageTo === 'number') {
    filteredQuery = filteredQuery.lte('mileage', filters.mileageTo);
  }
  
  // Apply search query
  if (searchQuery) {
    filteredQuery = filteredQuery.or(`make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
  }

  return filteredQuery;
};
