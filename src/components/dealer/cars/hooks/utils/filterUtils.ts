
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
  
  if (filters.yearMin && typeof filters.yearMin === 'number') {
    filteredQuery = filteredQuery.gte('year', filters.yearMin);
  }
  
  if (filters.yearMax && typeof filters.yearMax === 'number') {
    filteredQuery = filteredQuery.lte('year', filters.yearMax);
  }
  
  if (filters.priceMin && typeof filters.priceMin === 'number') {
    filteredQuery = filteredQuery.gte('reserve_price', filters.priceMin);
  }
  
  if (filters.priceMax && typeof filters.priceMax === 'number') {
    filteredQuery = filteredQuery.lte('reserve_price', filters.priceMax);
  }
  
  if (filters.mileageMin && typeof filters.mileageMin === 'number') {
    filteredQuery = filteredQuery.gte('mileage', filters.mileageMin);
  }
  
  if (filters.mileageMax && typeof filters.mileageMax === 'number') {
    filteredQuery = filteredQuery.lte('mileage', filters.mileageMax);
  }
  
  // Apply search query
  if (searchQuery) {
    filteredQuery = filteredQuery.or(`make.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%`);
  }

  return filteredQuery;
};
