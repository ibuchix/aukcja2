/**
 * Translates fuel type values to Polish
 */
export const translateFuelType = (fuelType: string | null | undefined): string => {
  if (!fuelType) return 'Nieznany';
  
  const translations: Record<string, string> = {
    'petrol': 'Benzyna',
    'diesel': 'Diesel',
    'electric': 'Elektryczny',
    'hybrid': 'Hybryda',
    'lpg': 'LPG',
    'cng': 'CNG',
    'plugin-hybrid': 'Plug-in Hybrid',
    'mild-hybrid': 'Mild Hybrid'
  };
  
  return translations[fuelType.toLowerCase()] || fuelType;
};
