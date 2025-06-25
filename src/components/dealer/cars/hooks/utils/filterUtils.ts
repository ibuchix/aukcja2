
import { AuctionFilters } from "../../../auction/types";

export const applyFilters = (query: any, filters: AuctionFilters, searchQuery: string) => {
  let filteredQuery = query;
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log('Applying filters:', {
      filters,
      searchQuery,
      filterKeys: Object.keys(filters)
    });
  }

  // Apply make filter with case-insensitive matching
  if (filters.make && typeof filters.make === 'string') {
    filteredQuery = filteredQuery.ilike('make', `%${filters.make}%`);
    if (isDev) {
      console.log('Applied make filter:', filters.make);
    }
  }
  
  // Apply model filter with case-insensitive matching
  if (filters.model && typeof filters.model === 'string') {
    filteredQuery = filteredQuery.ilike('model', `%${filters.model}%`);
    if (isDev) {
      console.log('Applied model filter:', filters.model);
    }
  }
  
  // Year filters
  if (filters.yearMin && typeof filters.yearMin === 'string') {
    const yearValue = parseInt(filters.yearMin);
    if (!isNaN(yearValue)) {
      filteredQuery = filteredQuery.gte('year', yearValue);
    }
  }
  
  if (filters.yearMax && typeof filters.yearMax === 'string') {
    const yearValue = parseInt(filters.yearMax);
    if (!isNaN(yearValue)) {
      filteredQuery = filteredQuery.lte('year', yearValue);
    }
  }
  
  // Price filters  
  if (filters.priceMin && typeof filters.priceMin === 'string') {
    const priceValue = parseFloat(filters.priceMin);
    if (!isNaN(priceValue)) {
      filteredQuery = filteredQuery.gte('reserve_price', priceValue);
    }
  }
  
  if (filters.priceMax && typeof filters.priceMax === 'string') {
    const priceValue = parseFloat(filters.priceMax);
    if (!isNaN(priceValue)) {
      filteredQuery = filteredQuery.lte('reserve_price', priceValue);
    }
  }
  
  // Mileage filters
  if (filters.mileageMin && typeof filters.mileageMin === 'string') {
    const mileageValue = parseFloat(filters.mileageMin);
    if (!isNaN(mileageValue)) {
      filteredQuery = filteredQuery.gte('mileage', mileageValue);
    }
  }
  
  if (filters.mileageMax && typeof filters.mileageMax === 'string') {
    const mileageValue = parseFloat(filters.mileageMax);
    if (!isNaN(mileageValue)) {
      filteredQuery = filteredQuery.lte('mileage', mileageValue);
    }
  }

  // Additional string filters
  if (filters.transmission && typeof filters.transmission === 'string') {
    filteredQuery = filteredQuery.ilike('transmission', `%${filters.transmission}%`);
  }

  if (filters.fuelType && typeof filters.fuelType === 'string') {
    filteredQuery = filteredQuery.ilike('fuel_type', `%${filters.fuelType}%`);
  }

  if (filters.serviceHistory && typeof filters.serviceHistory === 'string') {
    filteredQuery = filteredQuery.ilike('service_history_type', `%${filters.serviceHistory}%`);
  }
  
  // Apply search query with case-insensitive matching
  if (searchQuery && searchQuery.trim()) {
    const searchTerm = searchQuery.trim();
    filteredQuery = filteredQuery.or(`make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%`);
    if (isDev) {
      console.log('Applied search query:', searchTerm);
    }
  }

  if (isDev) {
    console.log('Filters applied successfully');
  }

  return filteredQuery;
};
