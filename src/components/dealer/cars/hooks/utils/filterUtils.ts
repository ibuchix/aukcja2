
import { AuctionFilters } from "../../../auction/types";
import { getCountySearchPatterns } from "@/constants/countyVariants";

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

  // Apply make filter - exact match (case-insensitive) for 100% accuracy
  if (filters.make && typeof filters.make === 'string') {
    filteredQuery = filteredQuery.ilike('make', filters.make);
    if (isDev) {
      console.log('Applied make filter (exact):', filters.make);
    }
  }
  
  // Apply model filter - exact match (case-insensitive) for 100% accuracy
  if (filters.model && typeof filters.model === 'string') {
    filteredQuery = filteredQuery.ilike('model', filters.model);
    if (isDev) {
      console.log('Applied model filter (exact):', filters.model);
    }
  }
  
  // Apply county filter - match all diacritical variants for Polish voivodeships
  if (filters.county && typeof filters.county === 'string') {
    const patterns = getCountySearchPatterns(filters.county);
    const orCondition = patterns
      .map(p => `county.ilike.%${p}%`)
      .join(',');
    filteredQuery = filteredQuery.or(orCondition);
    if (isDev) {
      console.log('Applied county filter with variants:', patterns);
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
