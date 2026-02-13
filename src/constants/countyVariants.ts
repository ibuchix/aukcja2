// Mapping of canonical Polish county names to all diacritical variants for search
const COUNTY_VARIANTS: Record<string, string[]> = {
  "Dolnośląskie": ["dolnośląskie", "dolnoslaskie", "dolnoślaskie", "dolnosląskie"],
  "Kujawsko-pomorskie": ["kujawsko-pomorskie"],
  "Łódzkie": ["łódzkie", "lodzkie", "łodzkie", "lódzkie"],
  "Lubelskie": ["lubelskie"],
  "Lubuskie": ["lubuskie"],
  "Małopolskie": ["małopolskie", "malopolskie"],
  "Mazowieckie": ["mazowieckie"],
  "Opolskie": ["opolskie"],
  "Podkarpackie": ["podkarpackie"],
  "Podlaskie": ["podlaskie"],
  "Pomorskie": ["pomorskie"],
  "Śląskie": ["śląskie", "slaskie", "ślaskie"],
  "Świętokrzyskie": ["świętokrzyskie", "swietokrzyskie", "świetokrzyskie", "swietokrzyskie"],
  "Warmińsko-mazurskie": ["warmińsko-mazurskie", "warminsko-mazurskie", "warmińsko mazurskie", "warminsko mazurskie"],
  "Wielkopolskie": ["wielkopolskie"],
  "Zachodniopomorskie": ["zachodniopomorskie"],
};

export const getCountySearchPatterns = (county: string): string[] => {
  const variants = COUNTY_VARIANTS[county];
  if (variants) return variants;
  // Fallback: use the county name as-is (lowercased)
  return [county.toLowerCase()];
};
