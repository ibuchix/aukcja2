// Vehicle feature translations from English to Polish
// Translation utilities for the dealer auction platform
export const translateVehicleFeature = (feature: string): string => {
  const featureTranslations: Record<string, string> = {
    // Main features
    'Air Conditioning': 'Klimatyzacja',
    'Navigation System': 'Nawigacja',
    'Navigation': 'Nawigacja',
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
    'Upgraded Sound': 'Ulepszone audio',
    
    // Underscore-separated features (database format)
    'Air_Conditioning': 'Klimatyzacja',
    'Navigation_System': 'Nawigacja',
    'Satellite_Navigation': 'Nawigacja',
    'Alloy_Wheels': 'Alufelgi',
    'Keyless_Entry': 'System bezkluczykowy',
    'Parking_Sensors': 'Czujniki parkowania',
    'Heated_Seats': 'Podgrzewane fotele',
    'Adaptive_Cruise_Control': 'Tempomat',
    'Cruise_Control': 'Tempomat',
    'Reverse_Camera': 'Kamera cofania',
    'Leather_Seats': 'Skórzana tapicerka',
    'Upgraded_Sound_System': 'Ulepszone audio',
    'Electric_Windows': 'Elektryczne szyby',
    'Central_Locking': 'Centralne zamki',
    'Power_Steering': 'Wspomaganie kierownicy',
    'Fog_Lights': 'Światła przeciwmgielne',
    'Xenon_Lights': 'Światła ksenonowe',
    'LED_Lights': 'Światła LED',
    'Automatic_Lights': 'Automatyczne światła',
    'Rain_Sensor': 'Czujnik deszczu',
    'Parking_Assistant': 'Asystent parkowania',
    'Lane_Assist': 'Asystent pasa ruchu',
    'Collision_Warning': 'Ostrzeganie o kolizji',
    'Blind_Spot_Monitor': 'Monitor martwego pola',
    'Start_Stop_System': 'System Start/Stop',
    'Dual_Zone_Climate': 'Klimatyzacja dwustrefowa',
    'Heated_Mirrors': 'Podgrzewane lusterka',
    'Electric_Mirrors': 'Elektryczne lusterka',
    'Folding_Mirrors': 'Składane lusterka',
    'Tinted_Windows': 'Przyciemniane szyby',
    'Roof_Rails': 'Relingi dachowe'
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
    'Engine Capacity': 'Pojemność silnika',
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
    'Reserve Price': 'Cena wyjściowa',
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
    'No': 'Nie',
    'Full Registration Document': 'Pełna dokumentacja rejestracyjna'
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

// Service history type translations
export const translateServiceHistoryType = (type: string | null | undefined): string => {
  if (!type) return 'Nie podano';
  
  const typeTranslations: Record<string, string> = {
    'full': 'Pełna',
    'partial': 'Częściowa',
    'none': 'Brak',
    'Full': 'Pełna',
    'Partial': 'Częściowa',
    'None': 'Brak'
  };

  const lowerType = type.toLowerCase();
  const matchingKey = Object.keys(typeTranslations).find(key => 
    key.toLowerCase() === lowerType
  );
  
  return matchingKey ? typeTranslations[matchingKey] : type;
};

// Error message translations
export const translateErrorMessage = (message: string): string => {
  const errorTranslations: Record<string, string> = {
    // Authentication errors
    'Authentication Error': 'Błąd uwierzytelniania',
    'There was a problem initializing the authentication system. Please try refreshing the page.': 'Wystąpił problem z inicjalizacją systemu uwierzytelniania. Odśwież stronę.',
    'Session Expired': 'Sesja wygasła',
    'Your session has expired for security reasons. Please sign in again to continue.': 'Twoja sesja wygasła ze względów bezpieczeństwa. Zaloguj się ponownie, aby kontynuować.',
    'Registration Error': 'Błąd rejestracji',
    'Registration in Progress': 'Rejestracja w toku',
    'Please complete the remaining steps to finish your registration.': 'Uzupełnij pozostałe kroki, aby zakończyć rejestrację.',
    
    // Login errors
    'Authentication failed. Please check your credentials and try again.': 'Uwierzytelnianie nie powiodło się. Sprawdź dane logowania i spróbuj ponownie.',
    'Incorrect email or password. Please try again.': 'Nieprawidłowy email lub hasło. Spróbuj ponownie.',
    'No account found with this email. Please check your email or register.': 'Nie znaleziono konta z tym adresem email. Sprawdź email lub zarejestruj się.',
    
    // Validation errors
    'Email is required': 'Email jest wymagany',
    'Password is required': 'Hasło jest wymagane',
    'Password must be at least 8 characters long': 'Hasło musi zawierać co najmniej 8 znaków',
    'Password must contain at least one number': 'Hasło musi zawierać co najmniej jedną cyfrę',
    'Password must contain at least one letter': 'Hasło musi zawierać co najmniej jedną literę',
    
    // Profile errors
    'Profile not available': 'Profil niedostępny',
    "We couldn't access your dealer profile. This may be due to a permission issue.": 'Nie udało się uzyskać dostępu do profilu dealera. Może to być problem z uprawnieniami.',
    
    // Bid placement errors
    'Dealer profile not found. Please ensure your profile is complete.': 'Profil dealera nie został znaleziony. Upewnij się, że Twój profil jest kompletny.',
    'Your dealer account is not verified. Please contact support.': 'Twoje konto dealera nie jest zweryfikowane. Skontaktuj się z pomocą techniczną.',
    'Please enter a valid number': 'Wprowadź poprawną liczbę',
    'Bid amount must be greater than 0': 'Kwota oferty musi być większa niż 0',
    'Auction Status Issue': 'Problem ze statusem aukcji',
    'Auction status is being synchronized. Retrying...': 'Status aukcji jest synchronizowany. Ponawiam próbę...',
    'Invalid response from server': 'Nieprawidłowa odpowiedź serwera',
    'Bidding System Busy': 'System licytacji zajęty',
    'The auction is experiencing high activity. Retrying your bid...': 'Aukcja cieszy się dużym zainteresowaniem. Ponawiam próbę złożenia oferty...',
    'Bid Placement Error': 'Błąd składania oferty',
    'Failed to place bid': 'Nie udało się złożyć oferty',
    
    // Database function error messages from place_bid()
    'Missing required parameters': 'Brakuje wymaganych parametrów',
    'Car not found': 'Pojazd nie został znaleziony',
    'Car is not available for auction': 'Pojazd nie jest dostępny w aukcji',
    'Auction is not currently active': 'Aukcja nie jest obecnie aktywna',
    'This auction is not currently active': 'Aukcja nie jest obecnie aktywna',
    'Dealer not found': 'Dealer nie został znaleziony',
    'Dealer is not verified': 'Dealer nie jest zweryfikowany',
    'Daily bid limit exceeded (40 bids per day)': 'Przekroczono dzienny limit ofert (40 ofert dziennie)',
    'Bid amount must be between 1 and 2,000,000 PLN': 'Kwota oferty musi być między 1 a 2 000 000 PLN',
    'Bid amount is too low': 'Kwota oferty jest za niska',
    'Bid placed successfully': 'Oferta złożona pomyślnie',
    
    // Data availability errors
    'Name not available': 'Imię niedostępne',
    'Phone not available': 'Telefon niedostępny',
    'Address not available': 'Adres niedostępny',
    'Loading seller details...': 'Ładowanie danych sprzedawcy...',
  };
  
  return errorTranslations[message] || message;
};

// Toast notification translations
export const translateToastMessage = (message: string): string => {
  const toastTranslations: Record<string, string> = {
    'Bid Placed Successfully': 'Oferta złożona pomyślnie',
    'Bid Placement Error': 'Błąd składania oferty',
    'Failed to place bid': 'Nie udało się złożyć oferty',
    'Auction Status Issue': 'Problem ze statusem aukcji',
    'Auction status is being synchronized. Retrying...': 'Status aukcji jest synchronizowany. Ponawiam próbę...',
    'Bidding System Busy': 'System licytacji zajęty',
    'The auction is experiencing high activity. Retrying your bid...': 'Aukcja cieszy się dużym zainteresowaniem. Ponawiam próbę złożenia oferty...',
  };
  
  return toastTranslations[message] || message;
};

// UI label translations
export const translateUILabel = (label: string): string => {
  const labelTranslations: Record<string, string> = {
    'Clear Auth Storage': 'Wyczyść dane uwierzytelniania',
    'Refresh Page': 'Odśwież stronę',
    'Recover Your Profile': 'Odzyskaj profil',
    'Complete Registration': 'Ukończ rejestrację',
    'Payment Due': 'Płatność należna',
    'Unpaid': 'Nieopłacone',
    'Paid': 'Opłacone',
    'Success': 'Sukces',
    'Error': 'Błąd',
    'Operation completed successfully': 'Operacja zakończona pomyślnie',
    'Try Again': 'Spróbuj ponownie',
    'Complete Your Profile': 'Uzupełnij profil',
    'Account Pending Verification': 'Konto oczekuje na weryfikację',
    'Account Verified': 'Konto zweryfikowane',
    'Account Rejected': 'Konto odrzucone',
    'Show password': 'Pokaż hasło',
    'Hide password': 'Ukryj hasło',
    'Loading Vehicle Search': 'Ładowanie wyszukiwania pojazdów',
    'Loading your dealer profile...': 'Ładowanie profilu dealera...',
    'Profile Loading Error': 'Błąd ładowania profilu',
    'Profile Setup Required': 'Wymagana konfiguracja profilu',
    'Complete Your Registration': 'Uzupełnij rejestrację',
    'Dealer account required': 'Wymagane konto dealera',
  };
  
  return labelTranslations[label] || label;
};

// Message translations (longer text blocks)
export const translateMessage = (message: string): string => {
  const messageTranslations: Record<string, string> = {
    "Your account is currently under review. You'll be notified once verified.": "Twoje konto jest obecnie sprawdzane. Otrzymasz powiadomienie po weryfikacji.",
    "Your dealer account has been approved and verified.": "Twoje konto dealera zostało zatwierdzone i zweryfikowane.",
    "Your account verification was rejected. Please contact support for more information.": "Weryfikacja Twojego konta została odrzucona. Skontaktuj się z pomocą techniczną, aby uzyskać więcej informacji.",
    "You need to complete your dealer profile before you can search for vehicles.": "Musisz ukończyć swój profil dealera, zanim będziesz mógł wyszukiwać pojazdy.",
    "This app is restricted to dealer accounts. Please register as a dealer.": "Ta aplikacja jest przeznaczona tylko dla dealerów. Zarejestruj się jako dealer.",
    "Please provide the required information to finish setting up your dealer account": "Podaj wymagane informacje, aby dokończyć konfigurację konta dealera",
  };

  return messageTranslations[message] || message;
};