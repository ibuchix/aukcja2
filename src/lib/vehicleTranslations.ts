// Vehicle feature translations from English to Polish
export const translateVehicleFeature = (feature: string): string => {
  const featureTranslations: Record<string, string> = {
    // Main features
    'Air Conditioning': 'Klimatyzacja',
    'Navigation System': 'Nawigacja',
    'Satellite Navigation': 'Nawigacja',
    'Alloy Wheels': 'Alufelgi',
    'Keyless Entry': 'System bezkluczykowy',
    'Bluetooth': 'Bluetooth',
    'Parking Sensors': 'Czujniki parkowania',
    'Heated Seats': 'Podgrzewane fotele',
    'Adaptive Cruise Control': 'Tempomat',
    'Cruise Control': 'Tempomat',
    'Sunroof': 'Panoramiczny dach',
    'Panoramic Roof': 'Panoramiczny dach',
    'Reverse Camera': 'Kamera cofania',
    'Leather Seats': 'Skórzana tapicerka',
    'Upgraded Sound System': 'Ulepszone audio',
    
    // Additional common features
    'ABS': 'ABS',
    'ESP': 'ESP',
    'Airbags': 'Poduszki powietrzne',
    'Electric Windows': 'Elektryczne szyby',
    'Central Locking': 'Centralne zamki',
    'Power Steering': 'Wspomaganie kierownicy',
    'Fog Lights': 'Światła przeciwmgielne',
    'Xenon Lights': 'Światła ksenonowe',
    'LED Lights': 'Światła LED',
    'Automatic Lights': 'Automatyczne światła',
    'Rain Sensor': 'Czujnik deszczu',
    'Parking Assistant': 'Asystent parkowania',
    'Lane Assist': 'Asystent pasa ruchu',
    'Collision Warning': 'Ostrzeganie o kolizji',
    'Blind Spot Monitor': 'Monitor martwego pola',
    'Start/Stop System': 'System Start/Stop',
    'Dual Zone Climate': 'Klimatyzacja dwustrefowa',
    'Heated Mirrors': 'Podgrzewane lusterka',
    'Electric Mirrors': 'Elektryczne lusterka',
    'Folding Mirrors': 'Składane lusterka',
    'Tinted Windows': 'Przyciemniane szyby',
    'Roof Rails': 'Relingi dachowe',
    'Towbar': 'Hak holowniczy',
    
    // CamelCase converted features
    'Sat Nav': 'Nawigacja',
    'Upgraded Sound': 'Ulepszone audio'
  };

  return featureTranslations[feature] || feature;
};

// Vehicle specification labels translations
export const translateSpecificationLabel = (label: string): string => {
  const labelTranslations: Record<string, string> = {
    'Year': 'Rok',
    'Mileage': 'Przebieg',
    'Transmission': 'Skrzynia biegów',
    'Fuel Type': 'Typ paliwa',
    'Number of Keys': 'Liczba kluczy',
    'Seat Material': 'Materiał tapicerki',
    'Make': 'Marka',
    'Model': 'Model',
    'VIN Number': 'Numer VIN',
    'VIN': 'Numer VIN',
    'Engine': 'Silnik',
    'Power': 'Moc',
    'Color': 'Kolor',
    'Doors': 'Liczba drzwi',
    'Seats': 'Liczba miejsc',
    'Body Type': 'Typ nadwozia',
    'Drive Type': 'Napęd',
    'Emission Standard': 'Norma emisji',
    'First Registration': 'Pierwsza rejestracja',
    'Service History': 'Historia serwisowa',
    'Damage Status': 'Stan uszkodzeń',
    'Registered in Poland': 'Zarejestrowany w Polsce',
    'Private Plate': 'Tablice prywatne',
    'Vehicle Condition': 'Stan pojazdu',
    'Vehicle Features': 'Wyposażenie pojazdu',
    'Additional Information': 'Dodatkowe informacje',
    'Seller Notes': 'Uwagi sprzedawcy',
    'Reserve Price': 'Cena orientacyjna',
    'Current Bid': 'Aktualna oferta',
    'Actions': 'Akcje',
    'View All': 'Zobacz wszystkie zdjęcia',
    'Basic Specifications': 'Specyfikacja podstawowa',
    'Not Specified': 'Nie podano',
    'Not specified': 'Nie podano',
    'Not available': 'Nie dostępne',
    'Location': 'Lokalizacja',
    'Registration': 'Rejestracja',
    'Vehicle Specifications': 'Specyfikacja pojazdu',
    'Damaged': 'Uszkodzony',
    'Yes': 'Tak',
    'No': 'Nie'
  };

  return labelTranslations[label] || label;
};

// Fuel type translations
export const translateFuelType = (fuelType: string | null | undefined): string => {
  if (!fuelType) return 'Nie podano';
  
  const fuelTranslations: Record<string, string> = {
    'Petrol': 'Benzyna',
    'Diesel': 'Diesel',
    'Electric': 'Elektryczny',
    'Hybrid': 'Hybrydowy',
    'LPG': 'LPG',
    'CNG': 'CNG',
    'Gasoline': 'Benzyna',
    'Gas': 'Benzyna',
    'E85': 'E85',
    'Plug-in Hybrid': 'Hybrydowy plug-in'
  };

  const lowerFuelType = fuelType.toLowerCase();
  const matchingKey = Object.keys(fuelTranslations).find(key => 
    key.toLowerCase() === lowerFuelType
  );
  
  return matchingKey ? fuelTranslations[matchingKey] : fuelType;
};

// Seat material translations
export const translateSeatMaterial = (material: string | null | undefined): string => {
  if (!material) return 'Nie podano';
  
  const materialTranslations: Record<string, string> = {
    'Leather': 'Skóra',
    'Fabric': 'Tkanina',
    'Alcantara': 'Alcantara',
    'Synthetic Leather': 'Sztuczna skóra',
    'Velour': 'Welur',
    'Cloth': 'Tkanina',
    'Vinyl': 'Winyl',
    'Suede': 'Zamsz'
  };

  const lowerMaterial = material.toLowerCase();
  const matchingKey = Object.keys(materialTranslations).find(key => 
    key.toLowerCase() === lowerMaterial
  );
  
  return matchingKey ? materialTranslations[matchingKey] : material;
};